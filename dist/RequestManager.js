'use strict';

const shortid = require('shortid');

const { createLogger } = require('./Logger');

const Logger = createLogger('vim-driver');

class RequestManagerImpl {

  constructor(id, socket) {
    _initialiseProps.call(this);

    this._id = id;
    this._socket = socket;
    this._pendingRequests = {};

    this._addListeners();
  }

  send(payload) {
    return new Promise((resolve, reject) => {
      const id = this._id;
      const socket = this._socket;
      const pendingRequests = this._pendingRequests;
      const requestId = shortid.generate();

      pendingRequests[requestId] = { resolve, reject };

      const rawMessage = JSON.stringify([requestId, payload]);
      Logger.debug(`client: ${id}, message-out: ${rawMessage}`);
      socket.write(rawMessage + '\n');
    });
  }

  _addListeners() {
    const socket = this._socket;
    socket.addListener('data', this._onData);
  }

  _removeListeners() {
    const socket = this._socket;
    socket.removeListener('data', this._onData);
  }

  destroy() {
    this._removeListeners();
  }
}

var _initialiseProps = function () {
  this._onData = rawData => {
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
};

module.exports = RequestManagerImpl;