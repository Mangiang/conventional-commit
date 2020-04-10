const child = require('child_process');

const exec = (cmd: string): string => {
  return child.execSync(cmd).toString('utf-8');
};

export default exec;