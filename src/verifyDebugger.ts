import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class VerifierDebugger {
    private _decorationTypeMap: Map<boolean | undefined, vscode.TextEditorDecorationType> | undefined;
    private _verificationResults: Map<string, boolean> = new Map();

    constructor() {
        this._decorationTypeMap = new Map([
            [
                undefined, 
                vscode.window.createTextEditorDecorationType({
                    gutterIconPath: path.join(__dirname, '..', 'resources', 'history.svg'),
                    gutterIconSize: '85%',
                })
            ],
            [
                true, 
                vscode.window.createTextEditorDecorationType({
                    gutterIconPath: path.join(__dirname, '..', 'resources', 'pass.svg'),
                    gutterIconSize: '85%',
                })
            ],
            [
                false, 
                vscode.window.createTextEditorDecorationType({
                    gutterIconPath: path.join(__dirname, '..', 'resources', 'error.svg'),
                    gutterIconSize: '85%',
                })
            ],
        ]);
    }

    updateVerificationDecoration(editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor) {
        // Clear previous decorations
        editor?.setDecorations(this._decorationTypeMap?.get(undefined)!, []);

        if (!editor) {
            return;
        }

        // Get the text of the current document
        const doc = editor.document;
        const text = doc.getText();

        // Regular expression to find @id annotations in JavaScript docstrings for functions
        const idPattern = /(\/\*\*[\s\S]*?@id\s*(\w+)?[\s\S]*?\*\/|\/\/\s*@id\s*(\w+)?)([\s\S]*?function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\([^)]*\)\s*\{[^}]*\})/gm;
        let matches;
        let decorations: Array<{
            verificationResult: boolean | undefined, 
            decorationProps: { 
                decoration: vscode.TextEditorDecorationType, 
                range: vscode.Range
            }
        }> = [];

        while ((matches = idPattern.exec(text)) !== null) {
            const id = matches[4]; // Capturing group 1 or 2 will contain the @id value
            if (id) {
                const funcLine = id.split('\n').find((l) => l.includes('function'));
                const line = text.split('\n').findIndex((l) => l.includes(funcLine || ''));
                const startPos = new vscode.Position(line, 0);
                const endPos = new vscode.Position(line, text.split('\n')[line].length);
                const range = new vscode.Range(startPos, endPos);

                // Get the verification result for the current @id
                const verificationResult = this._verificationResults.get(matches[2] || matches[3]);

                // Set the decoration based on the verification result
                const decorationProps = {
                    decoration: this._decorationTypeMap?.get(verificationResult)!, 
                    range: range
                };
                decorations.push({ verificationResult: verificationResult, decorationProps: decorationProps });
            }
        }

        const decorationsToApply: Map<boolean | undefined, { 
            decoration: vscode.TextEditorDecorationType, 
            range: vscode.Range[]
        }> = new Map();

        // Group the decorations by verification result
        decorations.forEach((d) => {
            if (!decorationsToApply.has(d.verificationResult)) {
                decorationsToApply.set(d.verificationResult, { decoration: d.decorationProps.decoration, range: [] });
            }
            decorationsToApply.get(d.verificationResult)?.range.push(d.decorationProps.range);
        });

        // Apply the decorations to the editor
        decorationsToApply.forEach((d) => {
            editor.setDecorations(d.decoration, d.range);
        });
    }

    doVerification() {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showErrorMessage('No file to verify.');
            return;
        }

        const terminal = vscode.window.terminals.find((t) => t.name === 'Javert')|| vscode.window.createTerminal('Javert');

        const filePath = vscode.window.activeTextEditor?.document.uri.fsPath;
        const dirPath = filePath ? path.dirname(filePath) : '';
        const fileName = filePath ? path.basename(filePath) : '';
        if (!filePath || !fs.existsSync(filePath) || !fs.existsSync(dirPath) || !fileName.endsWith('.js')) {
            vscode.window.showErrorMessage('No file path found.');
            return;
        }

        const outPath = path.join(dirPath, '.gillian');
        if (!fs.existsSync(outPath)) {
            fs.mkdirSync(outPath);
        }

        this._verificationResults.clear();

        terminal.sendText(
            `docker run -ti --rm -v ${dirPath}:/app/test-algorithms 677877e05b9b gillian-js verify /app/test-algorithms/${fileName} --result-dir=/app/test-algorithms/.gillian`,
            true
        );

        // Dirty hack to wait for the verification to complete
        setTimeout(() => {
            const data = fs.readFileSync(path.join(outPath, 'verif_results.json'), 'utf8');
            const results = JSON.parse(data);
            for (const result of results) {
                this._verificationResults.set(result[0][0], result[1]);
            }
            this.updateVerificationDecoration(vscode.window.activeTextEditor);
        }, 2000);
        
        vscode.window.showInformationMessage('Verification complete.');
    }

    dispose() {
        this._decorationTypeMap?.forEach((decoration) => {
            decoration.dispose();
        });
    }
}