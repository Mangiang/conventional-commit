import { push, getCurrentBranch } from './gitCommands'

import { window } from 'vscode';


export const add_files = async () => {
    const remote = await window.showInputBox({
        value: 'origin',
        placeHolder: 'Enter remote',
        validateInput: text => {
            return text.length == 0 ? 'The remote cannot be empty' : null;
        }
    });

    const currentBranch = getCurrentBranch() || 'master'
    const branch = await window.showInputBox({
        value: 'master',
        placeHolder: 'Enter the folder to add to the commit',
        validateInput: text => {
            return text.length == 0 ? 'The branch cannot be empty' : null;
        }
    });
    if (remote && branch) {
        window.showInformationMessage(`Pushing ${branch} to ${remote}`);
        push(remote, branch)
    }
}