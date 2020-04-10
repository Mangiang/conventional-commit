import exec from './execution';
import { CmdResponse } from './execution';

export const addFiles = (filesPath: string): CmdResponse => {
    return exec('git', ['add', filesPath]);
};

export const commit = (name: string): CmdResponse => {
    return exec('git', ['commit', '-m', name]);
};

export const getCurrentBranch = (): string | null => {
    const result: Buffer | string = exec('git', ['branch']).stdout;
    let resultStr: string = '';
    if (typeof result) {
        resultStr = result.toString('utf-8');
    }

    const match = resultStr.match(/^\s*\*\s*(.+)\s*$/);
    if (!match) { return null; };

    return match[1];
};

export const push = (remote: string, branch: string): CmdResponse => {
    return exec('git', ['push', remote, branch]);
};