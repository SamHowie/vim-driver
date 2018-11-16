// @flow

const colors = require('colors/safe');
const fs = require('fs');
const path = require('path');
const rl = require('readline');

import type {Stats} from 'fs';

const EXAMPLES = ['hello_vim_driver', 'ascii_art'];

const main = async () => {
  let info = colors.green('\nvim-driver examples:\n');
  info += '\n';
  info += EXAMPLES.map((example, idx) =>
    colors.green(`  [${idx}] ${example}`),
  ).join('\n');
  info += '\n';
  console.log(info);

  while (true) {
    const question = colors.grey('Please select an example [0]: ');
    const answer = await readline(question);
    const idx = answer === '' ? 0 : parseInt(answer);
    if (idx < EXAMPLES.length) {
      console.log('');
      const p = path.join(__dirname, EXAMPLES[idx], 'main.js');
      // $FlowFixMe
      return require(p);
    }
    console.log(colors.red('Invalid selection.'));
  }
};

const readline = (message: string): Promise<string> => {
  return new Promise(resolve => {
    const r = rl.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    r.question(message, answer => {
      r.close();
      resolve(answer);
    });
  });
};

const readdir = (path: string): Promise<Array<string>> => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
};

const stat = (path: string): Promise<Stats> => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (error, stats) => {
      if (error) {
        reject(error);
      } else {
        resolve(stats);
      }
    });
  });
};

main();
