'use strict';

var reporters = require('../../').reporters;
var Spec = reporters.Spec;
var Base = reporters.Base;

var createMockRunner = require('./helpers').createMockRunner;
var makeRunReporter = require('./helpers.js').createRunReporterFunction;

describe('Spec reporter', function() {
  var runner;
  var options = {};
  var runReporter = makeRunReporter(Spec);
  var useColors;
  var expectedTitle = 'expectedTitle';

  beforeEach(function() {
    useColors = Base.useColors;
    Base.useColors = false;
  });

  afterEach(function() {
    Base.useColors = useColors;
    runner = undefined;
  });

  describe('on suite', function() {
    it('should return title', function() {
      var suite = {
        title: expectedTitle
      };
      runner = createMockRunner('suite', 'suite', null, null, suite);
      var stdout = runReporter({epilogue: function() {}}, runner, options);
      var expectedArray = [expectedTitle + '\n'];
      expect(stdout, 'to equal', expectedArray);
    });
  });
  describe('on pending', function() {
    it('should return title', function() {
      var suite = {
        title: expectedTitle
      };
      runner = createMockRunner('pending test', 'pending', null, null, suite);
      var stdout = runReporter({epilogue: function() {}}, runner, options);
      var expectedArray = ['  - ' + expectedTitle + '\n'];
      expect(stdout, 'to equal', expectedArray);
    });
  });
  describe('on pass', function() {
    describe('if test speed is slow', function() {
      it('should return expected tick, title and duration', function() {
        var expectedDuration = 2;
        var test = {
          title: expectedTitle,
          duration: expectedDuration,
          slow: function() {
            return 1;
          }
        };
        runner = createMockRunner('pass', 'pass', null, null, test);
        var stdout = runReporter({epilogue: function() {}}, runner, options);
        var expectedString =
          '  ' +
          Base.symbols.ok +
          ' ' +
          expectedTitle +
          ' (' +
          expectedDuration +
          'ms)' +
          '\n';
        expect(stdout[0], 'to be', expectedString);
      });
    });
    describe('if test speed is fast', function() {
      it('should return expected tick, title and without a duration', function() {
        var expectedDuration = 1;
        var test = {
          title: expectedTitle,
          duration: expectedDuration,
          slow: function() {
            return 2;
          }
        };
        runner = createMockRunner('pass', 'pass', null, null, test);
        var stdout = runReporter({epilogue: function() {}}, runner, options);
        var expectedString =
          '  ' + Base.symbols.ok + ' ' + expectedTitle + '\n';
        expect(stdout[0], 'to be', expectedString);
      });
    });
  });
  describe('on fail', function() {
    it('should return title and function count', function() {
      var functionCount = 1;
      var test = {
        title: expectedTitle
      };
      runner = createMockRunner('fail', 'fail', null, null, test);
      var stdout = runReporter({epilogue: function() {}}, runner, options);
      var expectedArray = ['  ' + functionCount + ') ' + expectedTitle + '\n'];
      expect(stdout, 'to equal', expectedArray);
    });
    describe('with showErrorsImmediately option', function() {
      it('should log error immediately', function() {
        var expectedTitle = 'expectedTitle';
        var functionCount = 1;
        var error = new Error('expectedMessage');
        var test = {
          title: expectedTitle,
          titlePath: function() {
            return [this.title];
          }
        };
        runner.on = function(event, callback) {
          if (event === 'fail') {
            test.err = error;
            callback(test);
          }
        };
        Spec.call({epilogue: function() {}}, runner, {
          reporterOptions: {showErrorsImmediately: true}
        });
        process.stdout.write = stdoutWrite;
        expect(stdout[0]).to.eql(
          [
            '  ' + functionCount + ') ' + expectedTitle + ':',
            '   ' + error.stack.replace(/^/gm, '  '),
            '',
            ''
          ].join('\n')
        );
      });
    });
  });
  describe('on end', function() {
    describe('with showErrorsImmediately option', function() {
      it('should not log error details again', function() {
        var expectedSuiteTitle = 'expectedSuiteTitle';
        var suite = {
          title: expectedSuiteTitle
        };
        var functionCount = 1;
        var error = new Error('expectedMessage');
        var expectedTestTitle = 'expectedTestTitle';
        var test = {
          title: expectedTestTitle,
          titlePath: function() {
            return [this.title];
          }
        };
        runner.on = function(event, callback) {
          if (event === 'suite') {
            callback(suite);
          }
          if (event === 'fail') {
            test.err = error;
            callback(test);
          }
        };
        Spec.call({epilogue: function() {}}, runner, {
          reporterOptions: {showErrorsImmediately: true}
        });
        process.stdout.write = stdoutWrite;
        var expectedArray = [
          expectedSuiteTitle + '\n',
          [
            '  ' + functionCount + ') ' + expectedTestTitle + ':',
            '   ' + error.stack.replace(/^/gm, '  '),
            '',
            ''
          ].join('\n')
        ];
        expect(stdout).to.eql(expectedArray);
      });
    });
  });
});
