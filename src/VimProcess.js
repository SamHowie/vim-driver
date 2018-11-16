// @flow

'use strict';

const {spawn} = require('child_process');
const path = require('path');

import type {ChildProcess} from 'child_process';
import type {Subscription} from './Subscription';

export interface VimProcess {
  +kill: () => Promise<VimProcess>;
  +subscribe: (subscriber: VimProcessSubscriber) => Subscription;
}

export type VimProcessSubscriber = {
  +onClose?: (code: number, signal: string) => any,
  +onDisconnect?: () => any,
  +onError?: (err: Error) => any,
  +onExit?: (code: number, signal: string) => any,
};

export type VimProcessOpts = {
  +executable: string,
  +host: string,
  +port: number,
};

class VimProcessImpl implements VimProcess {
  _id: string;
  _process: ChildProcess;
  _subscriptions: Array<VimProcessSubscriber>;

  constructor(id: string, opts: VimProcessOpts) {
    this._id = id;
    this._subscriptions = [];

    const commands: Array<string> = [];

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

    const child = spawn(shellCommand, {shell: true});

    this._process = child;
  }

  subscribe(subscriber: VimProcessSubscriber): Subscription {
    const subscriptions = this._subscriptions;
    subscriptions.push(subscriber);
    return {
      unsubscribe: () => {
        const index = subscriptions.indexOf(subscriber);
        if (index !== -1) {
          subscriptions.splice(index, 1);
        }
      },
    };
  }

  async kill(): Promise<VimProcess> {
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
