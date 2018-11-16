// @flow

'use strict';

const shortid = require('shortid');

const {createLogger} = require('./Logger');

import type {Socket as NetSocket} from 'net';

interface PendingPromise {
  +resolve: any => void;
  +reject: any => void;
}

export interface RequestManager {
  +send: (payload: mixed) => Promise<any>;
  +destroy: () => void;
}

const Logger = createLogger('vim-driver');

class RequestManagerImpl implements RequestManager {
  _id: string;
  _socket: NetSocket;
  _pendingRequests: {[string]: PendingPromise};

  constructor(id: string, socket: NetSocket) {
    this._id = id;
    this._socket = socket;
    this._pendingRequests = {};

    this._addListeners();
  }

  send(payload: mixed): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this._id;
      const socket = this._socket;
      const pendingRequests = this._pendingRequests;
      const requestId = shortid.generate();

      pendingRequests[requestId] = {resolve, reject};

      const rawMessage = JSON.stringify([requestId, payload]);
      Logger.debug(`client: ${id}, message-out: ${rawMessage}`);
      socket.write(rawMessage + '\n');
    });
  }

  _addListeners(): void {
    const socket = this._socket;
    socket.addListener('data', this._onData);
  }

  _removeListeners(): void {
    const socket = this._socket;
    socket.removeListener('data', this._onData);
  }

  _onData = (rawData: string): void => {
    const id = this._id;
    const pendingRequests = this._pendingRequests;
    const splitRawData = rawData.toString().split(/\n/);

    for (const rawMessage of splitRawData) {
      if (rawMessage === '') {
        continue;
      }

      const message = JSON.parse(rawMessage);
      const messageId = message[0];

      const resolver = pendingRequests[messageId];
      if (resolver == null) {
        // TODO: Log that this is an unknown message
        Logger.error(`client ${id} received an unknown message: ${rawMessage}`);
        continue;
      }

      delete pendingRequests[messageId];

      const messagePayload = message[1];
      Logger.debug(`client: ${id}, message-in: ${rawMessage}`);
      resolver.resolve(messagePayload);
    }
  };

  destroy() {
    this._removeListeners();
  }
}

module.exports = RequestManagerImpl;
