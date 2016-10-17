const Jasmine = require('jasmine')
const SpecReporter = require('jasmine-spec-reporter')

const config = {
  spec_dir: 'test/',
  spec_files: ['*.test.js'],
  stopSpecOnExpectationFailure: false,
  random: false
}

const jrunner = new Jasmine()
jrunner.configureDefaultReporter({print: () => {}})    // remove default reporter logs
jasmine.getEnv().addReporter(new SpecReporter({displaySpecDuration: true}))   // add jasmine-spec-reporter
jrunner.loadConfig(config)           // load jasmine.json configuration
jrunner.execute()
