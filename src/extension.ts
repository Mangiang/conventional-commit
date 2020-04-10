// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, commands, ExtensionContext, workspace } from 'vscode';
import { create_commit } from './create_commit';
import { add_files } from './add_files';
import { push_commit } from './push_commit';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	context.subscriptions.push(commands.registerCommand('conventional-commit.commit', async () => {
		if (!workspace.rootPath) {
			window.showErrorMessage("Path invalid you need to open a folder first");
			return;
		}

		const options: { [key: string]: (context: ExtensionContext) => Promise<void> } = {
			'Create Commit': create_commit,
			'Add Files': add_files,
			'Push Commit': push_commit
		};
		const quickPick = window.createQuickPick();
		quickPick.items = Object.keys(options).map((label: string) => ({ label }));
		quickPick.onDidChangeSelection(selection => {
			if (selection[0]) {
				options[selection[0].label](context)
					.catch(console.error);
			}
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	}));
}

// this method is called when your extension is deactivated
export function deactivate() { }
