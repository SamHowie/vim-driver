// @flow

'use strict';

const RequestManager = require('./RequestManager');

import type {Socket as NetSocket} from 'net';
import type {Subscription} from './Subscription';

export interface RemoteClient {
  // Commands
  +call: (name: string, arglist: Array<mixed>) => Promise<any>;
  +edit: (path: string) => Promise<any>;
  +eval: (string: string) => Promise<any>;
  +execute: (command: string) => Promise<any>;
  // Management
  +close: () => Promise<RemoteClient>;
  +getId: () => string;
  +isConnected: () => boolean;
  +send: (payload: any) => Promise<any>;
  +subscribe: (subscriber: RemoteClientSubscriber) => Subscription;
}

export type RemoteClientSubscriber = {
  onClose?: () => any,
  onConnect?: () => any,
  onError?: (error: Error) => any,
};

class RemoteClientImpl implements RemoteClient {
  _id: string;
  _requestManager: RequestManager;
  _socket: NetSocket;
  _subscribers: Array<RemoteClientSubscriber>;

  constructor(id: string, socket: NetSocket) {
    this._id = id;
    this._socket = socket;
    this._subscribers = [];
    this._requestManager = new RequestManager(id, socket);
    this._addListeners();
  }

  getId(): string {
    return this._id;
  }

  async call(name: string, arglist: Array<mixed>): Promise<any> {
    const payload = {type: 'command:call', name, arglist};
    const request = this._requestManager;
    const response = await request.send(payload);
    if (response.error) {
      throw response.error;
    }
    return response.result;
  }

  async edit(path: string): Promise<any> {
    const payload = {type: 'command:edit', path};
    const request = this._requestManager;
    const response = await request.send(payload);
    if (response.error) {
      throw response.error;
    }
    return null;
  }

  async eval(string: string): Promise<any> {
    const payload = {type: 'command:eval', string};
    const request = this._requestManager;
    const response = await request.send(payload);
    if (response.error) {
      throw response.error;
    }
    return response.result;
  }

  async execute(command: string | Array<string>): Promise<any> {
    const payload = {type: 'command:execute', command};
    const request = this._requestManager;
    const response = await request.send(payload);
    if (response.error) {
      throw response.error;
    }
    return response.result;
  }

  close(): Promise<RemoteClient> {
    return new Promise((resolve, reject) => {
      this._socket.destroy();
      this._onClose();
      resolve(this);
    });
  }

  isConnected(): boolean {
    // $FlowFixMe
    return !this._socket.destroyed;
  }

  async send(payload: any): Promise<any> {
    const request = this._requestManager;
    return await request.send(payload);
  }

  subscribe(subscriber: RemoteClientSubscriber): Subscription {
    const subscribers = this._subscribers;
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

  _onClose = () => {
    this._requestManager.destroy();
    this._removeListeners();
    this._subscribers.forEach(subscriber => {
      if (subscriber.onClose) {
        subscriber.onClose();
      }
    });
  };

  _onData = (data: string) => {};

  _onEnd = () => {
    this.close();
  };

  _onError = (error: Error) => {
    this._subscribers.forEach(subscriber => {
      if (subscriber.onError) {
        subscriber.onError(error);
      }
    });
  };
}

module.exports = RemoteClientImpl;
