---
id: Server
title: Server
---

## Description

## Methods

### Server.close

`Server.close() => Promise<Server>`

#### Description

Closes the RPC server, disconnects connected clients, and prevents future
clients from connecting.

#### Example

```javascript
const server = new Server();
await server.listen(host, port);

const remote = new HeadlessRemoteClient({host, port});
await remote.connect(server);

await server.close();

console.log(server.isListening()); // => false
console.log(remote.isConnected()); // => false

await remote.connect(server); // throws!
```

### Server.isListening

`Server.isListening() => boolean`

#### Description

Returns true when the RPC server is listening for connecting clients.

#### Example

```javascript
const server = new Server();

await server.listen(host, port);
console.log(server.isListening()); // => true

await server.close();
console.log(server.isListening()); // => false
```

### Server.listen

`Server.listen(host: string, port: number) => Promise<Server>`

#### Description

Starts the RPC server and listens on host and port for connecting clients.

#### Example

```javascript
const server = new Server();
await server.listen(host, port);

const remote = new HeadlessRemoteClient({host, port});
await remote.connect(server);
```

### Server.subscribe

`Server.subscribe(subscriber: ServerSubscriber) => Subscription`
