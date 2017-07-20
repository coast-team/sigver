const bunyan = require('bunyan')

const log = bunyan.createLogger({
  name: 'sigver',
  level: 'trace'
})

export default log
