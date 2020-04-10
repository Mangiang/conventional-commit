import { push, getCurrentBranch } from './utils/gitCommands';

import { window } from 'vscode';
import { CmdResponse } from './utils/execution';
import { useProgressBar } from './utils/useProgressBar';


export const push_commit = async () => {
    const remote = await window.showInputBox({
        value: 'origin',
        placeHolder: 'Enter remote',
        validateInput: text => {
            return text.length === 0 ? 'The remote cannot be empty' : null;
        }
    });

    const currentBranch = getCurrentBranch() || 'master';
    const branch = await window.showInputBox({
        value: currentBranch,
        placeHolder: 'Enter the folder to add to the commit',
        validateInput: text => {
            return text.length === 0 ? 'The branch cannot be empty' : null;
        }
    });
    if (remote && branch) {
        useProgressBar(`Pushing ${branch} to ${remote}`, false, new Promise(resolve => {
            const response: CmdResponse = push(remote, branch);
            if (response.status !== 0) {
                if (response.error) { window.showErrorMessage(response.error.message); }
                if (response.stderr) { window.showErrorMessage(response.stderr.toString('utf-8')); }
                return;
            }
            if (response.stderr) { window.showInformationMessage(response.stderr.toString('utf-8')); }
            if (response.stdout) { window.showInformationMessage(response.stdout.toString('utf-8')); }
            resolve();
        }));
    }
};