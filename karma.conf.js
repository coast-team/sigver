// Karma configuration
// Generated on Mon Oct 17 2016 16:21:56 GMT+0200 (CEST)

module.exports = function (config) {
  config.set({
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [{ pattern: 'test/test.js' }, { pattern: 'src/**/*', included: false, served: false }],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*test.js': ['esbuild'],
    },

    esbuild: {
      // Replace some global variables
      platform: 'browser',
      target: 'es2015',
      define: {
        global: 'window',
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'PRODUCTION'),
      },
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: ['Chrome', 'Firefox'],

    browsers: ['ChromiumHeadless', 'FirefoxHeadless'],

    customLaunchers: {
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless'],
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    browserNoActivityTimeout: 30000,
  })
}
