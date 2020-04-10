import { QuickPickItem, window } from 'vscode';
import { commit } from './utils/gitCommands';
import { CmdResponse } from './utils/execution';
import { MultiStepInput } from './utils/multiStepInputHelper';
import { useProgressBar } from './utils/useProgressBar';
import { resolve } from 'dns';

export const create_commit = async () => {
    const title = 'Create commit';

    const commitShortType: Record<string, string> = {
        'Feature': 'feat',
        'Bug fix': 'fix',
        'Refactorization': 'refacto',
        'Style': 'style',
        'Chore': 'chore',
        'CI': 'ci'
    };

    const commitTypes: QuickPickItem[] = ['Feature', 'Bug fix', 'Build', 'Refactorization', 'Style', 'Chore', 'CI']
        .map(label => ({ label }));

    interface State {
        commitType: string;
        scope: string;
        message: string;
    }

    const collectInputs = async () => {
        const state = {} as Partial<State>;
        await MultiStepInput.run(input => pickCommitType(input, state));
        return state as State;
    };

    const pickCommitType = async (input: MultiStepInput, state: Partial<State>) => {
        const pick = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 3,
            placeholder: 'Pick a commit type',
            items: commitTypes,
            activeItem: typeof state.commitType !== 'string' ? state.commitType : undefined,
            shouldResume: shouldResume
        });
        state.commitType = commitShortType[pick.label];
        return (input: MultiStepInput) => pickCommitScope(input, state);
    };

    const pickCommitScope = async (input: MultiStepInput, state: Partial<State>) => {
        state.scope = await input.showInputBox({
            title,
            step: 2,
            totalSteps: 3,
            value: state.scope || '',
            prompt: 'Enter a scope for the current commit',
            validate: validateIsValidScope,
            shouldResume: shouldResume
        });
        return (input: MultiStepInput) => pickCommitMessage(input, state);
    };

    const validateIsValidScope = async (name: string) => {
        return name.match(/[\w_-]+/) ? undefined : 'Scope is not valid';
    };

    const pickCommitMessage = async (input: MultiStepInput, state: Partial<State>) => {
        state.message = await input.showInputBox({
            title,
            step: 3,
            totalSteps: 3,
            value: state.message || '',
            prompt: 'Enter a message for the current commit',
            validate: validateIsValidMessage,
            shouldResume: shouldResume
        });
    };

    const validateIsValidMessage = async (name: string) => {
        return name.match(/[\w_-\s]+/) ? undefined : 'Message is not valid';
    };

    const shouldResume = () => {
        // Could show a notification with the option to resume.
        return new Promise<boolean>((resolve, reject) => {

        });
    };

    const state = await collectInputs();
    const commitName = `${state.commitType}(${state.scope}): ${state.message}`;
    window.showInformationMessage(`Creating commit ${commitName}`);

    useProgressBar("Creating commit ...", false, new Promise((resolve) => {
        const response: CmdResponse = commit(commitName);
        if (response.status !== 0) {
            if (response.error) { window.showErrorMessage(response.error.message); }
            if (response.stderr) { window.showErrorMessage(response.stderr.toString('utf-8')); }
            return;
        }
        if (response.stderr) { window.showInformationMessage(response.stderr.toString('utf-8')); }
        if (response.stdout) { window.showInformationMessage(response.stdout.toString('utf-8')); }
        resolve();
    }));
};
