const SpecReporter = require('jasmine-spec-reporter').SpecReporter;
const JUnitXmlReporter = require('jasmine-reporters').JUnitXmlReporter;

const env: any = jasmine.getEnv();   // typings are broken...
env.clearReporters();                // remove default reporter logs

jasmine.getEnv().addReporter(new SpecReporter({  // add jasmine-spec-reporter
  spec: {
    displayPending: true
  }
}));

jasmine.getEnv().addReporter(new JUnitXmlReporter({
    savePath: './',
    filePrefix: 'jasmine-test',
    consolidateAll: true
}));
