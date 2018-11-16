'use strict';

const net = require('net');

const identifyClient = require('./identifyClient');
const { createLogger } = require('./Logger');
const RemoteClient = require('./RemoteClient');

const Logger = createLogger('vim-driver');

class ServerImpl {

  constructor() {
    this._onClose = () => {
      this._pendingIdentifications.forEach(identification => identification.cancel());
      this._pendingIdentifications.length = 0;
      const subscribers = this._subscribers;
      for (const subscriber of subscribers) {
        if (subscriber.onClose != null) {
          subscriber.onClose();
        }
      }
    };

    this._onConnection = socket => {
      const pendingIdentifications = this._pendingIdentifications;

      let abort;
      const abortPromise = new Promise(resolve => {
        abort = resolve;
      });

      const cancel = {
        cancel: () => {
          abort();
        }
      };
      pendingIdentifications.push(cancel);

      const removePendingIdentifcation = () => {
        const index = pendingIdentifications.indexOf(cancel);
        if (index !== -1) {
          pendingIdentifications.splice(index, 1);
        }
      };

      identifyClient(socket, abortPromise).then(([socket, id]) => {
        Logger.debug(`client connected as: ${id}`);
        this._onIdentification(socket, id);
        removePendingIdentifcation();
      }, err => {
        Logger.error('client identification error:\n' + err);
        removePendingIdentifcation();
      });
    };

    this._onIdentification = (socket, id) => {
      const remote = new RemoteClient(id, socket);
      remote.subscribe({
        onClose: () => {
          this._removeRemote(remote);
        }
      });
      this._addRemote(remote);
    };

    this._onError = error => {
      Logger.error(error.message);
      const subscribers = this._subscribers;
      for (const subscriber of subscribers) {
        if (subscriber.onError != null) {
          subscriber.onError(error);
        }
      }
    };

    const server = net.createServer();
    this._pendingIdentifications = [];
    this._remotes = [];
    this._server = server;
    this._subscribers = [];
    this._addServerListeners(server);
  }

  close() {
    return new Promise((resolve, reject) => {
      this._remotes.map(remote => remote.close());
      this._remotes.length = 0;
      this._server.close(() => resolve(this));
    });
  }

  isListening() {
    // $FlowFixMe
    return this._server.listening;
  }

  listen(host, port) {
    const server = this._server;
    return new Promise((resolve, reject) => {
      // $FlowFixMe
      if (server.listening) {
        reject('server already open');
      }
      server.listen({ host, port }, () => {
        Logger.info(`server is listening on: ${host}:${port}`);
        resolve(this);
      });
    });
  }

  subscribe(subscriber) {
    const subscribers = this._subscribers;
    this._subscribers.push(subscriber);
    return {
      unsubscribe: () => {
        const index = subscribers.indexOf(subscriber);
        if (index !== -1) {
          subscribers.splice(index);
        }
      }
    };
  }

  _addServerListeners(server) {
    server.addListener('close', this._onClose);
    server.addListener('connection', this._onConnection);
    server.addListener('error', this._onError);
  }

  _removeServerListeners(server) {
    server.removeListener('close', this._onClose);
    server.removeListener('connection', this._onConnection);
    server.removeListener('error', this._onError);
  }

  _addRemote(remote) {
    const remotes = this._remotes;
    remotes.push(remote);
    const subscribers = this._subscribers;
    for (const subscriber of subscribers) {
      if (subscriber.onConnect != null) {
        subscriber.onConnect(remote);
      }
    }
  }

  _removeRemote(remote) {
    const remotes = this._remotes;
    const index = remotes.indexOf(remote);
    if (index !== -1) {
      remotes.splice(index, 1);
    }
  }

}

module.exports = ServerImpl;