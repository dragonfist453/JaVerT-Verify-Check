import * as vscode from 'vscode';
import { VerifierDebugger } from './verifyDebugger';

export function activate(context: vscode.ExtensionContext) {
	let verifyDebugger = new VerifierDebugger();

	let doVerificationDisposable = vscode.commands.registerCommand('javert-verify-check.doVerification', () => {
		verifyDebugger.doVerification();
	});

	context.subscriptions.push(
		doVerificationDisposable
	);

	let activeEditor = vscode.window.activeTextEditor;
	let timeout: NodeJS.Timeout | undefined = undefined;

	function triggerUpdateDecorations(throttle = false) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (throttle) {
			timeout = setTimeout(() => verifyDebugger.updateVerificationDecoration(activeEditor), 500);
		} else {
			verifyDebugger.updateVerificationDecoration(activeEditor);
		}
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument((event) => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);
}

// This method is called when your extension is deactivated
export function deactivate() {}
