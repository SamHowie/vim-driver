'use strict';

const identifyClient = (socket, abort) => {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const addListeners = () => {
      // TODO: add close listener
      socket.addListener('data', onData);
    };

    const removeListeners = () => {
      socket.removeListener('data', onData);
    };

    const onData = rawData => {
      removeListeners();
      resolved = true;

      const splitRawData = rawData.toString().split(/\n/);
      const message = JSON.parse(splitRawData[0]);
      const messageId = message[0];
      const messagePayload = message[1];
      const clientId = messagePayload.id;

      if (splitRawData.length !== 2 || splitRawData[1] !== '' || messageId !== '$id' || clientId == null) {
        reject(new Error('recieved unexpected client identification'));
      } else {
        resolve([socket, clientId]);
      }
    };

    addListeners();

    abort.then(() => {
      if (resolved) {
        return;
      }
      removeListeners();
      reject(new Error('pending client identification was aborted'));
    });
  });
};

module.exports = identifyClient;