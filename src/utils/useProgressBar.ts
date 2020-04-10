import { window, ProgressLocation } from 'vscode';

export const useProgressBar = (title: string = 'Loading ...',
    cancellable: boolean = false,
    promise: Promise<void> = new Promise((resolve) => resolve())) => {

    window.withProgress({
        location: ProgressLocation.Notification,
        cancellable,
        title: `[Conventional-commit] ${title}`
    }, async (progress) => {
        await promise;
        progress.report({ increment: 100 });
    });
};