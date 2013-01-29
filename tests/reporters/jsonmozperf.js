/**
 * Initialize a new `JSON` reporter for MozTest.
 *
 * @param {Runner} runner
 * @api public
 */

(function(global) {

function JSONMozPerfReporter(runner) {
  var self = this;
  global.Mocha.reporters.Base.call(this, runner);
  global.mocha.options.ignoreLeaks = true;

  var failures = [];
  var passes = [];

  runner.on('test', function(test) {
    global.mozPerfDurations = null;
  });

  runner.on('pass', function(test){
    if (global.mozPerfDurations === null) {
      test.err = new Error('No perf data was reported');
      failures.push(test);
      return;
    }

    for (title in mozPerfDurations) {
      passes.push({
        title: test.title + ' ' + title,
        fullTitle: test.fullTitle() + ' ' + title,
        duration: test.duration,
        mozPerfDuration: mozPerfDurations[title]
      });
    }
  });

  runner.on('fail', function(test, err) {
    failures.push(test);
  });

  runner.on('end', function(){
    var obj = {
      stats: self.stats,
      failures: failures.map(cleanErr),
      passes: passes
    };

    process.stdout.write(JSON.stringify(obj, null, 2));
  });
}

function cleanErr(test) {
  var err = test.err;
  var message = err.message || '';
  var stack = window.xpcError.format(err);
  var index = stack.indexOf(message) + message.length;
  var msg = stack.slice(0, index);
  var actual = err.actual;
  var expected = err.expected;

  return {
    title: test.title,
    fullTitle: test.fullTitle(),
    duration: test.duration,
    stack: stack,
    index: index,
    msg: msg,
    actual: actual,
    expected: expected
  }
};
global.Mocha.reporters.JSONMozPerf = JSONMozPerfReporter;
})(this);
