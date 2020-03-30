import pino from 'pino'

const level = process.env.NODE_ENV === 'development' ? 'debug' : 'info'

export const log = pino({ name: 'sigver', level })
