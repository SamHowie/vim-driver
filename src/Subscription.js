// @flow

'use strict';

export interface Subscription {
  +unsubscribe: () => any;
}
