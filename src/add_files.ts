import { addFiles } from './gitCommands'

import { window } from 'vscode';


export const add_files = async () => {
    const path = await window.showInputBox({
        value: '.',
        placeHolder: 'Enter the folder to add to the commit',
        validateInput: text => {
            return text.length == 0 ? 'The path cannot be empty' : null;
        }
    });
    if (path) {
        window.showInformationMessage(`Adding all files in : ${path}`);
        addFiles(path)
    }
}