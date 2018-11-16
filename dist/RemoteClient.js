'use strict';

const RequestManager = require('./RequestManager');

class RemoteClientImpl {

  constructor(id, socket) {
    this._onClose = () => {
      this._requestManager.destroy();
      this._removeListeners();
      this._subscribers.forEach(subscriber => {
        if (subscriber.onClose) {
          subscriber.onClose();
        }
      });
    };

    this._onData = data => {};

    this._onEnd = () => {
      this.close();
    };

    this._onError = error => {
      this._subscribers.forEach(subscriber => {
        if (subscriber.onError) {
          subscriber.onError(error);
        }
      });
    };

    this._id = id;
    this._socket = socket;
    this._subscribers = [];
    this._requestManager = new RequestManager(id, socket);
    this._addListeners();
  }

  getId() {
    return this._id;
  }

  async call(name, arglist) {
    const payload = { type: 'command:call', name, arglist };
    const request = this._requestManager;
    const response = await request.send(payload);
    if (response.error) {
      throw response.error;
    }
    return response.result;
  }

  async edit(path) {
    const payload = { type: 'command:edit', path };
    const request = this._requestManager;
    const response = await request.send(payload);
    if (response.error) {
      throw response.error;
    }
    return null;
  }

  async eval(string) {
    const payload = { type: 'command:eval', string };
    const request = this._requestManager;
    const response = await request.send(payload);
    if (response.error) {
      throw response.error;
    }
    return response.result;
  }

  async execute(command) {
    const payload = { type: 'command:execute', command };
    const request = this._requestManager;
    const response = await request.send(payload);
    if (response.error) {
      throw response.error;
    }
    return response.result;
  }

  close() {
    return new Promise((resolve, reject) => {
      this._socket.destroy();
      this._onClose();
      resolve(this);
    });
  }

  isConnected() {
    // $FlowFixMe
    return !this._socket.destroyed;
  }

  async send(payload) {
    const request = this._requestManager;
    return await request.send(payload);
  }

  subscribe(subscriber) {
    const subscribers = this._subscribers;
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

  _addListeners() {
    const socket = this._socket;
    socket.addListener('close', this._onClose);
    socket.addListener('data', this._onData);
    socket.addListener('end', this._onEnd);
    socket.addListener('error', this._onError);
  }

  _removeListeners() {
    const socket = this._socket;
    socket.removeListener('close', this._onClose);
    socket.removeListener('data', this._onData);
    socket.removeListener('end', this._onEnd);
    socket.removeListener('error', this._onError);
  }

}

module.exports = RemoteClientImpl;