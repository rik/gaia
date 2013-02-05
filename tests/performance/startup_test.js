require('apps/sms/test/integration/app.js');
require('/tests/js/performance_helper.js');

suite('SMS', function() {
  var device;
  var app;

  MarionetteHelper.start(function(client) {
    app = new MessagesIntegration(client);
    device = app.device;
  });

  setup(function() {
    yield IntegrationHelper.unlock(device); // it affects the first run otherwise
    yield PerformanceHelper.registerLoadTimeListener(device);
  });

  teardown(function() {
    yield PerformanceHelper.unregisterLoadTimeListener(device);
  });

  test('appName? ' + window.appName, function() {
    console.log(window.appName);
  })

  test('average GENERIC startup time', function() {
    this.timeout(100000);

    for (var i = 0; i < PerformanceHelper.kRuns; i++) {
      yield IntegrationHelper.delay(device, PerformanceHelper.kSpawnInterval);
      yield app.launch();
      yield app.close();
    }

    var results = yield PerformanceHelper.getLoadTimes(device);

    console.log("\n=== GENNNNERIC average load time: " + PerformanceHelper.average(results) + "ms");
  });
});
