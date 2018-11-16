---
id: RemoteClientSubscriber
title: RemoteClientSubscriber
---

## Description

## Callbacks

### RemoteClientSubscriber.onClose

`RemoteClientSubscriber.onClose() => any`

#### Description

The `onClose` callback is fired when the clients connection to the RPC server is
closed.

#### Example

```javascript
const subscription = remote.subscribe({
  onClose: () => console.log('remote client was closed'),
});

await remote.close();

subscription.unsubscribe();
```

### RemoteClientSubscriber.onConnect

`RemoteClientSubscriber.onConnect() => any`

#### Description

The `onConnect` callback is fired when the client connects to the RPC server.

**NOTE:** Only `HeadlessRemoteClient`s fire the onConnect callback.

#### Example

```javascript
const server = new Server();
await server.listen(host, port);

const remote = new HeadlessRemoteClient({host, port});

const subscription = remote.subscribe({
  onConnect: () => console.log('remote client was connected'),
});

await remote.connect(server);

subscription.unsubscribe();
```

### RemoteClientSubscriber.onError

`RemoteClientSubscriber.onError(error: Error) => any`

#### Description

The `onError` callback is fired when the client encounters a recoverable exception.

#### Example

```javascript
const subscription = remote.subscribe({
  onError: (error: Error) => console.log(error),
});
subscription.unsubscribe();
```
