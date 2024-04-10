import * as vscode from 'vscode';
import * as path from 'path';

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

        // Regular expression to find @id annotations in JavaScript comments
        const idPattern = /\/\*\*[\s\S]*?@id\s*(\w+)?[\s\S]*?\*\/|\/\/\s*@id\s*(\w+)?/gm;
        let matches;
        let decorations: vscode.DecorationOptions[] = [];

        while ((matches = idPattern.exec(text)) !== null) {
            const id = matches[1] || matches[2]; // Capturing group 1 or 2 will contain the @id value
            if (id) {
                const line = text.substring(matches.index).split('\n').length - 1;
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
        vscode.window.showInformationMessage('Verification complete.');
    }

    verificationFailed() {
        vscode.window.showErrorMessage('Verification failed.');
    }
}