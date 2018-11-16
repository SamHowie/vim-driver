// @flow

'use strict';

export interface Cancelable {
  +cancel: () => any;
}
