// @flow

const colors = require('colors/safe');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 8765;

const printHeadedClientInstructions = (name: string): void => {
  console.log('');
  console.log(
    colors.green(`Please follow the steps below to view the ${name} demo.`),
  );

  console.log('');
  console.log(colors.yellow('Open a vim client at the project root:'));
  console.log('');
  const projectRoot: string = path.join.call(
    null,
    ...__dirname.split('/').slice(0, -2),
  );
  console.log(colors.white(`  $ cd ${projectRoot}`));
  console.log(colors.white(`  $ vim`));

  console.log('');
  console.log(
    colors.yellow('Connect the vim client to the vim-driver server:'),
  );
  console.log('');
  console.log(colors.white('  :source dist/VimDriverClient.vim'));
  console.log(colors.white(`  :call VimDriverClient#open("${HOST}", ${PORT})`));
  console.log('');
};

module.exports = {
  HOST,
  PORT,
  printHeadedClientInstructions,
};
