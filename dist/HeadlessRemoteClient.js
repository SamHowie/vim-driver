'use strict';

const shortid = require('shortid');

const RemoteClientImpl = require('./RemoteClient');
const VimProcess = require('./VimProcess');
const { createLogger } = require('./Logger');

const DEFAULT_EXEC = 'vim';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 8765;

const Logger = createLogger('vim-driver');

class HeadlessRemoteClientImpl {

  constructor(opts = {}) {
    this._id = shortid.generate();
    this._opts = opts;
    this._subscribers = [];
    this._remoteAssignmentSubscribers = [];
  }

  getId() {
    return this._id;
  }

  isConnected() {
    const remote = this._remote;
    return remote != null ? remote.isConnected() : false;
  }

  connect(server) {
    return new Promise((resolve, reject) => {
      if (this._remote != null) {
        Logger.warn(`Failed to connect to server. Client ${this._id} is already connected to a server.`);
        return reject(`HeadlessRemoteClient is already connected.`);
      }

      const self = this;
      const subscription = server.subscribe({
        onConnect(remote) {
          if (remote.getId() === self._id) {
            subscription.unsubscribe();
            self._assignRemote(remote);
            resolve(self);
          }
        }
      });

      const opts = this._opts;
      this._vimProcess = new VimProcess(self._id, {
        executable: opts.executable != null ? opts.executable : DEFAULT_EXEC,
        host: opts.host != null ? opts.host : DEFAULT_HOST,
        port: opts.port != null ? opts.port : DEFAULT_PORT
      });
    });
  }

  async call(name, arglist) {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${this._id} not connected. Failed to execute 'call'.`;
      Logger.error(msg);
      throw msg;
    }
    return this._remote.call(name, arglist);
  }

  async edit(path) {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${this._id} not connected. Failed to execute 'edit'.`;
      Logger.error(msg);
      throw msg;
    }
    return this._remote.edit(path);
  }

  async eval(string) {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${this._id} not connected. Failed to execute 'eval'.`;
      Logger.error(msg);
      throw msg;
    }
    return this._remote.eval(string);
  }

  async execute(command) {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${this._id} not connected. Failed to execute 'execute'.`;
      Logger.error(msg);
      throw msg;
    }
    return this._remote.execute(command);
  }

  async close() {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient ${this._id} not connected. Failed to close.`;
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

  async send(payload) {
    if (this._remote == null) {
      const msg = `HeadlessRemoteClient not connected. Failed to send.`;
      Logger.error(msg);
      throw msg;
    }
    const response = await this._remote.send(payload);
    return response;
  }

  subscribe(subscriber) {
    const subscribers = this._subscribers;
    subscribers.push(subscriber);

    let remoteSubscription;
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
      }
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
      }
    };
  }

  _assignRemote(remote) {
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

  _unassignRemote() {
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

  _subscribeRemoteAssignment(subscriber) {
    const subscribers = this._remoteAssignmentSubscribers;
    subscribers.push(subscriber);
    return {
      unsubscribe: () => {
        const index = subscribers.indexOf(subscriber);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
      }
    };
  }
}

module.exports = HeadlessRemoteClientImpl;