---
id: RemoteClient
title: RemoteClient
---

## Description

## Remote Commands

### RemoteClient.call

`RemoteClient.call(name: string, arglist: Array<mixed>) => Promise<any>`

#### Description

Remote command to call a vim function with the specified arguments.

See `:help call`

#### Example

```javascript
const result = await remote.call('eval', ['1 + 1']);
console.log(result); // => 2
```

### RemoteClient.edit

`RemoteClient.edit(path: string) => Promise<any>`

#### Description

Remote command to edit a file.

See `:help edit`

#### Example

```javascript
await remote.edit('foo');
const result = await remote.call('expand', ['%:t']);
console.log(result); // => 'foo'
```

### RemoteClient.eval

`RemoteClient.eval(string: string) => Promise<any>`

#### Description

Remote command to evaluate an expression.

See `:help eval`

#### Example

```javascript
const result = await remote.eval('1 + 2 + 3 + 4 + 5');
console.log(result); // => 15
```

### RemoteClient.execute

`RemoteClient.execute(command: string) => Promise<any>`

#### Description

Remote command to execute an evaluated string as an Ex command.

See `:help execute`

#### Example

```javascript
const result = await remote.execute(`pwd`);
console.log(result === process.env.PWD); // => true
```

## Remote Client Management

### RemoteClient.close

`RemoteClient.close() => Promise<RemoteClient>`

#### Description

Disconnects the remote client from the RPC server.

After the remote client disconnects the `RemoteClientSubscriber.onClose` callback is executed.

#### Example

```javascript
let closed = false;

remote.subscribe({
  onClose: () => closed = true,
});

await remote.close();

console.log(remote.isConnected()); // => false
console.log(closed); // => true
```

### RemoteClient.getId

`RemoteClient.getId() => string`

#### Description

Returns the id of the remote client.

#### Example

```javascript
console.log(remote.getId()); // => 'S1R4CDilX'
```

### RemoteClient.isConnected

`RemoteClient.isConnected() => boolean`

#### Description

Returns true when the client is connected to the RPC server.

#### Example

```javascript
console.log(remote.isConnected()); // => true
await remote.close();
console.log(remote.isConnected()); // => false
```

### RemoteClient.send

`RemoteClient.send(payload: any) => Promise<any>`

#### Description

Sends the remote client an arbitrary payload via the RPC server. The resulting
promise is resolved with the response from the client.

#### Example

```javascript
await response = remote.send({
  type: 'command:eval',
  string: '1 + 2 + 3 + 4 + 5',
});
console.log(resonse.result); // => 15
```

### RemoteClient.subscribe

`RemoteClient.subscribe(subscriber: RemoteClientSubscriber) => Subscription`

#### Description

Creates a subscription to RemoteClient events:

* `RemoteClientSubscriber.onClose() => any`
* `RemoteClientSubscriber.onConnect() => any`
* `RemoteClientSubscriber.onError(error: Error) => any`

#### Example

```javascript
const subscription = remote.subscribe({
  onClose() {
    // Do something on close
  },
  onConnect() {
    // Do something on connect
  },
  onError(error: Error) {
    // Do something on error
  },
});
subscription.unsubscribe();
```
