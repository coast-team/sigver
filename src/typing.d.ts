/* tslint:disable */

/**
 * Extends "global" variable
 */
declare namespace NodeJS {
  interface Global {
    log: any
  }
}

declare var log: any
