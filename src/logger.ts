import bunyan from 'bunyan'

// Config LOGGER
export const log = bunyan.createLogger({ name: 'sigver', level: 'trace' })
