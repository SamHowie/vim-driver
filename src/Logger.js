// @flow

'use strict';

const colors = require('colors/safe');

interface Logger {
  +info: string => void;
  +warn: string => void;
  +debug: string => void;
  +error: string => void;
  +fatal: string => void;
}

const LOG_LEVEL = {
  trace: 5,
  debug: 4,
  info: 3,
  warn: 2,
  error: 1,
  fatal: 0,
};

const isLogLevelPermission = (level: number): boolean => {
  const envLevel = LOG_LEVEL[process.env.LOG_LEVEL || 'warn'];
  return (envLevel != null ? envLevel : LOG_LEVEL.warn) >= level;
};

const noop = (message: string): void => {};

const createLogger = (name: string): Logger => ({
  /**
   * This level designates finer-grained informational tracing events than debug.
   */
  trace: isLogLevelPermission(LOG_LEVEL.trace)
    ? console.log.bind(console, colors.green.grey(`[${name}|trace]`))
    : noop,

  /**
   * This level designates fine-grained informational events for debugging
   * a program.
   */
  debug: isLogLevelPermission(LOG_LEVEL.debug)
    ? console.log.bind(console, colors.blue.bold(`[${name}|debug]`))
    : noop,

  /**
   * This level designates informational messages.
   */
  info: isLogLevelPermission(LOG_LEVEL.info)
    ? console.log.bind(console, colors.green.bold(`[${name}|info]`))
    : noop,

  /**
   * This level designates events that could potentially cause application
   * issues.
   */
  warn: isLogLevelPermission(LOG_LEVEL.warn)
    ? console.log.bind(console, colors.yellow.bold(`[${name}|warn]`))
    : noop,

  /**
   * This level designates error events from which the application may be able
   * to continue.
   */
  error: isLogLevelPermission(LOG_LEVEL.error)
    ? console.log.bind(console, colors.red.bold(`[${name}|error]`))
    : noop,

  /**
   * This level designates en arror that is fatal to the application.
   */
  fatal: isLogLevelPermission(LOG_LEVEL.fatal)
    ? console.log.bind(console, colors.red.bold(`[${name}|fatal]`))
    : noop,
});

module.exports = {
  createLogger,
};
