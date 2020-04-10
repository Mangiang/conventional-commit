import { addFiles } from './gitCommands';
import { CmdResponse } from './execution';
import { window, workspace } from 'vscode';
import { join } from 'path';

export const add_files = async () => {
    const path = await window.showInputBox({
        value: '.',
        placeHolder: 'Enter the folder to add to the commit',
        validateInput: text => {
            return text.length === 0 ? 'The path cannot be empty' : null;
        }
    });
    if (path) {
        window.showInformationMessage(`Adding all files in : ${join(workspace.rootPath!!, path)}`);
        const response: CmdResponse = addFiles(path);
        if (response.status !== 0){
            if (response.error) { window.showErrorMessage(response.error.message); }
            if (response.stderr) { window.showErrorMessage(response.stderr.toString('utf-8')); }
            return;
        }
        if (response.stderr) { window.showInformationMessage(response.stderr.toString('utf-8')); }
        if (response.stdout) { window.showInformationMessage(response.stdout.toString('utf-8')); }
    }
    else {
        add_files();
    }
};