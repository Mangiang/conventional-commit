import { QuickPickItem, window, Disposable, QuickInputButton, QuickInput, QuickInputButtons } from 'vscode';
import { commit } from './gitCommands';
import { CmdResponse } from './execution';

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
    
    const response: CmdResponse = commit(commitName);
    if (response.error) { window.showErrorMessage(response.error.message); }
    if (response.stderr) { window.showErrorMessage(response.stderr.toString('utf-8')); }
    if (response.stdout) { window.showInformationMessage(response.stdout.toString('utf-8')); }
};



// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------


class InputFlowAction {
    private constructor() { }
    static back = new InputFlowAction();
    static cancel = new InputFlowAction();
    static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
    title: string;
    step: number;
    totalSteps: number;
    items: T[];
    activeItem?: T;
    placeholder: string;
    buttons?: QuickInputButton[];
    shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
    title: string;
    step: number;
    totalSteps: number;
    value: string;
    prompt: string;
    validate: (value: string) => Promise<string | undefined>;
    buttons?: QuickInputButton[];
    shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

    static async run<T>(start: InputStep) {
        const input = new MultiStepInput();
        return input.stepThrough(start);
    }

    private current?: QuickInput;
    private steps: InputStep[] = [];

    private async stepThrough<T>(start: InputStep) {
        let step: InputStep | void = start;
        while (step) {
            this.steps.push(step);
            if (this.current) {
                this.current.enabled = false;
                this.current.busy = true;
            }
            try {
                step = await step(this);
            } catch (err) {
                if (err === InputFlowAction.back) {
                    this.steps.pop();
                    step = this.steps.pop();
                } else if (err === InputFlowAction.resume) {
                    step = this.steps.pop();
                } else if (err === InputFlowAction.cancel) {
                    step = undefined;
                } else {
                    throw err;
                }
            }
        }
        if (this.current) {
            this.current.dispose();
        }
    }

    async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createQuickPick<T>();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.placeholder = placeholder;
                input.items = items;
                if (activeItem) {
                    input.activeItems = [activeItem];
                }
                input.buttons = [
                    ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
                    ...(buttons || [])
                ];
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidChangeSelection(items => resolve(items[0])),
                    input.onDidHide(() => {
                        (async () => {
                            reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
                        })()
                            .catch(reject);
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }

    async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createInputBox();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.value = value || '';
                input.prompt = prompt;
                input.buttons = [
                    ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
                    ...(buttons || [])
                ];
                let validating = validate('');
                disposables.push(
                    input.onDidTriggerButton(item => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidAccept(async () => {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(await validate(value))) {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    }),
                    input.onDidChangeValue(async text => {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = await current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    }),
                    input.onDidHide(() => {
                        (async () => {
                            reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
                        })()
                            .catch(reject);
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach(d => d.dispose());
        }
    }
}
