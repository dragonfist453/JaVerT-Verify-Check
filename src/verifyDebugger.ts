import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class VerifierDebugger {
    private _decorationType: vscode.TextEditorDecorationType | undefined;

    constructor() {
        this._decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: path.join(__dirname, '..', 'resources', 'history.svg'),
            gutterIconSize: '85%',
        });
    }

    reloadVerification(editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor) {
        // Clear previous decorations
        editor?.setDecorations(this._decorationType!, []);

        if (!editor) {
            return;
        }

        // Get the text of the current document
        const doc = editor.document;
        const text = doc.getText();

        // Regular expression to find @id annotations in JavaScript docstrings for functions
        const idPattern = /(\/\*\*[\s\S]*?@id\s*(\w+)?[\s\S]*?\*\/|\/\/\s*@id\s*(\w+)?)([\s\S]*?function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\([^)]*\)\s*\{[^}]*\})/gm;
        let matches;
        let decorations: vscode.DecorationOptions[] = [];

        while ((matches = idPattern.exec(text)) !== null) {
            const id = matches[4]; // Capturing group 1 or 2 will contain the @id value
            if (id) {
                const funcLine = id.split('\n').find((l) => l.includes('function'));
                const line = text.split('\n').findIndex((l) => l.includes(funcLine || ''));
                const startPos = new vscode.Position(line, 0);
                const endPos = new vscode.Position(line, text.split('\n')[line].length);
                const range = new vscode.Range(startPos, endPos);

                const decoration = { range };
                decorations.push(decoration);
            }
        }

        // Apply the decorations to the editor
        editor.setDecorations(this._decorationType!, decorations);
    }

    verificationPassed() {
        if (!vscode.window.activeTextEditor) {
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

        terminal.sendText(
            `docker run -ti --rm -v ${dirPath}:/app/test-algorithms 677877e05b9b gillian-js verify /app/test-algorithms/${fileName} --result-dir=/app/test-algorithms/.gillian`,
            true
        );
        vscode.window.showInformationMessage('Verification complete.');
    }

    verificationFailed() {
        vscode.window.showErrorMessage('Verification failed.');
    }
}