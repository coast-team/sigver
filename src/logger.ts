import * as logLevel from 'loglevel'

export const log = (function () {
  const log = logLevel.getLogger('sigver')
  const level = process.env['NODE_ENV'] === 'development' ? 'debug' : 'info'
  log.setDefaultLevel(level)
  return log
})()
