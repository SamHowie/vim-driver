// @flow

'use strict';

const shortid = require('shortid');

const RemoteClientImpl = require('./RemoteClient');
const VimProcess = require('./VimProcess');
const {createLogger} = require('./Logger');

import type {RemoteClient, RemoteClientSubscriber} from './RemoteClient';
import type {Server} from './Server';
import type {Subscription} from './Subscription';

export type HeadlessRemoteClientOpts = {
  +executable?: string,
  +host?: string,
  +port?: number,
};

export interface HeadlessRemoteClient extends RemoteClient {
  +connect: (server: Server) => Promise<HeadlessRemoteClient>;
  +isConnected: () => boolean;
}

export interface RemoteClientAssignmentSubscriber {
  +onAssign?: (remote: RemoteClient) => any;
  +onUnassign?: (remote: RemoteClient) => any;
}

const DEFAULT_EXEC = 'vim';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8765;

const Logger = createLogger('vim-driver');

class HeadlessRemoteClientImpl implements HeadlessRemoteClient {
  _id: string;
  _remote: ?RemoteClient;
  _opts: HeadlessRemoteClientOpts;
  _subscribers: Array<RemoteClientSubscriber>;
  _remoteAssignmentSubscribers: Array<RemoteClientAssignmentSubscriber>;
  _vimProcess: ?VimProcess;

  constructor(opts?: HeadlessRemoteClientOpts = {}) {
    this._id = shortid.generate();
    this._opts = opts;
    this._subscribers = [];
    this._remoteAssignmentSubscribers = [];
  }

  getId(): string {
    return this._id;
  }

  isConnected(): boolean {
    const remote = this._remote;
    return remote != null ? remote.isConnected() : false;
  }

  connect(server: Server): Promise<HeadlessRemoteClient> {
    return new Promise((resolve, reject) => {
      if (this._remote != null) {
        Logger.warn(
          `Failed to connect to server. Client ${
            this._id
          } is already connected to a server.`,
        );
        return reject(`HeadlessRemoteClient is already connected.`);
      }

      const self = this;
      const subscription = server.subscribe({
        onConnect(remote: RemoteClient) {
          if (remote.getId() === self._id) {
            subscription.unsubscribe();
            self._assignRemote(remote);
            resolve(self);
          }
        },
      });

      const opts = this._opts;
      this._vimProcess = new VimProcess(self._id, {
        executable: opts.executable != null ? opts.executable : DEFAULT_EXEC,
        host: opts.host != null ? opts.host : DEFAULT_HOST,
        port: opts.port != null ? opts.port : DEFAULT_PORT,
      });
    });
  }

  async call(name: string, arglist: Array<mixed>): Promise<any> {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${
        this._id
      } not connected. Failed to execute 'call'.`;
      Logger.error(msg);
      throw msg;
    }
    return this._remote.call(name, arglist);
  }

  async edit(path: string): Promise<any> {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${
        this._id
      } not connected. Failed to execute 'edit'.`;
      Logger.error(msg);
      throw msg;
    }
    return this._remote.edit(path);
  }

  async eval(string: string): Promise<any> {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${
        this._id
      } not connected. Failed to execute 'eval'.`;
      Logger.error(msg);
      throw msg;
    }
    return this._remote.eval(string);
  }

  async execute(command: string): Promise<any> {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${
        this._id
      } not connected. Failed to execute 'execute'.`;
      Logger.error(msg);
      throw msg;
    }
    return this._remote.execute(command);
  }

  async close(): Promise<RemoteClient> {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${
        this._id
      } not connected. Failed to close.`;
      Logger.error(msg);
      throw msg;
    }
    await this._remote.close();
    if (this._vimProcess != null) {
      await this._vimProcess.kill();
    }
    this._unassignRemote();
    return this;
  }

  async send(payload: any): Promise<any> {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient not connected. Failed to send.`;
      Logger.error(msg);
      throw msg;
    }
    const response = await this._remote.send(payload);
    return response;
  }

  subscribe(subscriber: RemoteClientSubscriber): Subscription {
    const subscribers = this._subscribers;
    subscribers.push(subscriber);

    let remoteSubscription: ?Subscription;
    if (this._remote != null) {
      remoteSubscription = this._remote.subscribe(subscriber);
    }

    const remoteAssignmentObserver = this._subscribeRemoteAssignment({
      onAssign: remote => {
        if (remoteSubscription) {
          remoteSubscription.unsubscribe();
        }
        remoteSubscription = remote.subscribe(subscriber);
      },
      onUnassign: remote => {
        if (remoteSubscription) {
          remoteSubscription.unsubscribe();
          remoteSubscription = null;
        }
      },
    });

    return {
      unsubscribe: () => {
        const index = subscribers.indexOf(subscriber);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }

        remoteAssignmentObserver.unsubscribe();

        if (remoteSubscription) {
          remoteSubscription.unsubscribe();
        }
      },
    };
  }

  _assignRemote(remote: RemoteClient): void {
    this._remote = remote;
    this._remoteAssignmentSubscribers.forEach(subscriber => {
      if (subscriber.onAssign) {
        subscriber.onAssign(remote);
      }
    });
    this._subscribers.forEach(subscriber => {
      if (subscriber.onConnect) {
        subscriber.onConnect();
      }
    });
  }

  _unassignRemote(): void {
    if (this._remote == null) {
      return;
    }

    const remote = this._remote;
    this._remote = null;
    this._remoteAssignmentSubscribers.forEach(subscriber => {
      if (subscriber.onUnassign && remote) {
        subscriber.onUnassign(remote);
      }
    });
  }

  _subscribeRemoteAssignment(
    subscriber: RemoteClientAssignmentSubscriber,
  ): Subscription {
    const subscribers = this._remoteAssignmentSubscribers;
    subscribers.push(subscriber);
    return {
      unsubscribe: () => {
        const index = subscribers.indexOf(subscriber);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
      },
    };
  }
}

module.exports = HeadlessRemoteClientImpl;
