// @flow

const fs = require('fs');
const jsesc = require('jsesc');
const path = require('path');

const {HOST, PORT, printHeadedClientInstructions} = require('../util');
const Server = require('../../src/Server');

import type {RemoteClient} from '../../src/RemoteClient';

const main = async (): Promise<void> => {
  const server = new Server();
  await server.listen(HOST, PORT);

  printHeadedClientInstructions('ascii_art');

  server.subscribe({
    onConnect: async (remote: RemoteClient) => {
      const fileContents = await readFile(
        path.join(__dirname, 'source_image.txt'),
      );
      const lines = fileContents.split('\n');

      await remote.edit('ascii_art.txt');
      await prepareCanvas(remote, lines);
      await dissolveImage(remote, lines);
    },
  });
};

const readFile = (filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err != null) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const prepareCanvas = async (
  remote: RemoteClient,
  lines: Array<string>,
): Promise<void> => {
  let blankLines = lines.map(() => 'i').join('\\<esc>o\\<esc>');
  await remote.call('feedkeys', [blankLines]);
  await remote.call('feedkeys', ['\\<esc>']);
  const spaces = lines[0]
    .split('')
    .map(() => ' ')
    .join('');
  await remote.execute(`%s/^/${spaces}/`);
};

const dissolveImage = async (
  remote: RemoteClient,
  lines: Array<string>,
): Promise<void> => {
  const indexedLines = lines
    .map((line, i) => [i, line])
    .map(([i, line]) => [i, line.split('').map((char, i) => [i, char])]);

  await remote.execute('set paste');

  while (indexedLines.length > 0) {
    const i = randomRange(0, indexedLines.length - 1);
    const [lineIndex, line] = indexedLines[i];

    if (line.length === 0) {
      indexedLines.splice(i, 1);
      continue;
    }

    const j = randomRange(0, line.length - 1);
    const [charIndex, charValue] = line[j];

    if (charValue === ' ') {
      line.splice(j, 1);
      continue;
    }

    line.splice(j, 1);

    if (line.length === 0) {
      indexedLines.splice(i, 1);
    }

    let keys = `${lineIndex + 1}G${charIndex + 1}|r${jsesc(charValue)}`;

    await remote.call('feedkeys', [keys]);
  }

  await remote.execute('set nopaste');
};

const randomRange = (min, max): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

main();
