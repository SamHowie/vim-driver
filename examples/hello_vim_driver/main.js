// @flow

const path = require('path');

const {HOST, PORT, printHeadedClientInstructions} = require('../util');
const Server = require('../../src/Server');

const TYPING_SPEED = 50;

const main = async () => {
  const server = new Server();
  await server.listen(HOST, PORT);

  printHeadedClientInstructions('typist');

  server.subscribe({
    onConnect: async remote => {
      await remote.edit('Demo.txt');
      await type(remote, 'Hello, vim-driver!');
    },
  });
};

const type = async (remote, string) => {
  // Enter insert mode
  await remote.call('feedkeys', ['i']);

  // Type input string
  for (const letter of string.split('')) {
    await remote.call('feedkeys', [letter]);
    await sleep(TYPING_SPEED);
  }

  // Exit insert mode
  await remote.call('feedkeys', ['\\<ESC>']);
};

const sleep = (time: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
};

main();
