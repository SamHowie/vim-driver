# vim-driver

vim-driver provides a way for out-of-process programs to remotely instruct the behavior of vim instances.

![vim-driver demo](https://raw.githubusercontent.com/samhowie/vim-driver/master/images/demo.gif)

## Quick Start

### Step 1. Run a vim-driver server

#### Create project

```
$ mkdir my-project && cd my-project
$ yarn init
$ yarn add vim-driver
$ vim src/index.js
```

#### Define vim-driver server

This example vim-driver server instructs all connecting vim clients to type out the words: `Hello, vim-driver!`.

```javascript
const path = require('path');

const {Server} = require('vim-driver');

const HOST = '127.0.0.1';
const PORT = 8765;
const TYPING_SPEED = 50;

const main = async () => {
  const server = new Server();
  await server.listen(HOST, PORT);

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

const sleep = time => {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
};

main();
```

#### Start your vim-driver server

```
node src/index.js
```

### Step 2. Connect a vim instance to the vim-driver server

#### Open vim in a new shell

```
$ cd VIM_DRIVER_PROJECT_ROOT
$ vim
```

#### Connect your vim client to the vim-driver server

```
:source dist/VimDriverClient.vim
:call VimDriverClient#open("127.0.0.1", 8765)
```

## Automated Headless Testing

You can use vim-driver to run automated headless tests for your vim plugin!

See `src/__tests__/HeadlessRemoteClient.test.js` for examples.

```
$ yarn run test
```

## Examples

```
$ yarn run example
```
