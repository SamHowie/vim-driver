'use strict';

const { spawn } = require('child_process');
const path = require('path');

class VimProcessImpl {

  constructor(id, opts) {
    this._id = id;
    this._subscriptions = [];

    const commands = [];

    const sourcePath = path.join(__dirname, './VimDriverClient.vim');
    const source = `source ${sourcePath}`;
    commands.push(source);

    if (id != null) {
      const letId = `let g:vim_driver_client_id = '${id}'`;
      commands.push(letId);
    }

    const callOpen = `call VimDriverClient#open('${opts.host}', ${opts.port})`;
    commands.push(callOpen);

    const shellCommand = `${opts.executable} -c ":${commands.join('|')}"`;

    const child = spawn(shellCommand, { shell: true });

    this._process = child;
  }

  subscribe(subscriber) {
    const subscriptions = this._subscriptions;
    subscriptions.push(subscriber);
    return {
      unsubscribe: () => {
        const index = subscriptions.indexOf(subscriber);
        if (index !== -1) {
          subscriptions.splice(index, 1);
        }
      }
    };
  }

  async kill() {
    return new Promise((resolve, reject) => {
      const process = this._process;
      // $FlowFixMe
      if (process.killed) {
        resolve(this);
        return;
      }
      const onClose = (code, signal) => {
        process.removeListener('close', onClose);
        process.removeListener('exit', onClose);
        resolve(this);
      };
      process.addListener('close', onClose);
      process.addListener('exit', onClose);
      process.kill();
    });
  }
}

module.exports = VimProcessImpl;