// @flow

const HeadlessRemoteClient = require('../HeadlessRemoteClient');
const Server = require('../Server');

const HOST = '127.0.0.1';
const PORT = 1337;

let server: Server;
let remote: HeadlessRemoteClient;

beforeAll(async () => {
  server = new Server();
  await server.listen(HOST, PORT);
});

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  remote = new HeadlessRemoteClient({host: HOST, port: PORT});
  await remote.connect(server);
});

afterEach(async () => {
  if (remote.isConnected()) {
    await remote.close();
  }
});

test('remote.call returns function output', async () => {
  const result = await remote.call('eval', ['1 + 1']);
  expect(result).toBe(2);
});

test('remote.edit opens new buffer for edit', async () => {
  await remote.edit('test');
  const result = await remote.call('expand', ['%:t']);
  expect(result).toBe('test');
  await remote.execute('bd!');
});

test('remote.eval returns evaluation result', async () => {
  const result = await remote.eval('1 + 2 + 3 + 4 + 5');
  expect(result).toBe(15);
});

test('remote.execute returns evaluation result', async () => {
  const result = await remote.execute(`pwd`);
  expect(result).toBe(process.env.PWD);
});

test('can drive multiple remote clients', async () => {
  const remoteB = new HeadlessRemoteClient({host: HOST, port: PORT});
  await remoteB.connect(server);

  await Promise.all([remote.edit('foo'), remoteB.edit('bar')]);

  const [bufferNameA, bufferNameB] = await Promise.all([
    remote.call('expand', ['%:t']),
    remoteB.call('expand', ['%:t']),
  ]);

  expect(bufferNameA).toBe('foo');
  expect(bufferNameB).toBe('bar');

  remoteB.close();
});

test('remote.connect rejects when already connected', async () => {
  expect.assertions(1);
  try {
    await remote.connect(server);
  } catch (err) {
    expect(true).toBe(true);
  }
});

test('remote.close sets the isConnected state', async () => {
  const closePromise = remote.close();
  await closePromise;
  expect(remote.isConnected()).toBe(false);
});

test('remote.close calls the onClose callback', async () => {
  expect.assertions(1);

  const subscription = remote.subscribe({
    onClose: () => expect(true).toBe(true),
  });

  await remote.close();

  subscription.unsubscribe();
});

test('remote.connect calls the onConnect callback', async () => {
  expect.assertions(1);

  const subscription = remote.subscribe({
    onConnect: () => expect(true).toBe(true),
  });

  await remote.close();
  await remote.connect(server);

  subscription.unsubscribe();
});

test('can disconnect and reconnect remote', async () => {
  await remote.close();
  await remote.connect(server);
  const result = await remote.eval('1 + 3');
  expect(result).toBe(4);
});
