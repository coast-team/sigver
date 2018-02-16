/* tslint:disable */

/**
 * Extends "global" variable
 */
declare module NodeJS {
  interface Global {
    log: any
  }
}

declare var log: any
