const spawn = require('cross-spawn');
import { workspace } from 'vscode';

export class CmdResponse {
  pid: number = 0;
  output: Array<Buffer | string> = [];
  stdout: Buffer | string = '';
  stderr: Buffer | string = '';
  status: number | null = null;
  signal: string | null = null;
  error: Error = new Error();
}

const exec = (binary: string, args: Array<string>) => {
  return spawn.sync(binary, args, {cwd: workspace.rootPath});
};

export default exec;