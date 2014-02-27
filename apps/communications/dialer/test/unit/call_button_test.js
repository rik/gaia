/* globals CallButton, MockSimPicker, MockCallHandler, MockSimSettingsHelper,
           MocksHelper, MockNavigatorSettings, MockMozL10n, MockKeypadManager,
           MockMozMobileConnection, SimSettingsHelper */

'use strict';

require('/dialer/test/unit/mock_lazy_loader.js');
require('/dialer/test/unit/mock_l10n.js');
require('/dialer/test/unit/mock_mozMobileConnection.js');
require('/dialer/test/unit/mock_keypad.js');
require('/dialer/test/unit/mock_call_handler.js');
require('/shared/test/unit/mocks/mock_navigator_moz_settings.js');
require('/shared/test/unit/mocks/mock_sim_settings_helper.js');
require('/shared/test/unit/mocks/mock_option_menu.js');
require('/shared/test/unit/mocks/mock_sim_picker.js');

require('/dialer/js/call_button.js');

var mocksHelperForCallButton = new MocksHelper([
  'LazyL10n',
  'LazyLoader',
  'SimSettingsHelper',
  'OptionMenu',
  'SimPicker',
  'KeypadManager',
  'CallHandler'
]).init();

suite('SIM picker', function() {
  var subject;
  var realMozSettings;
  var realMozMobileConnections;
  var realMozL10n;
  var button;

  mocksHelperForCallButton.attachTestHelpers();

  suiteSetup(function() {
    subject = CallButton;

    realMozSettings = navigator.mozSettings;
    navigator.mozSettings = MockNavigatorSettings;

    realMozMobileConnections = navigator.mozMobileConnections;
    navigator.mozMobileConnections = [];

    realMozL10n = navigator.mozL10n;
    navigator.mozL10n = MockMozL10n;
    // We have to add a stub function to localize because SIM picker uses it,
    // but it's tested in the OptionMenu tests.
    navigator.mozL10n.localize = function() {};

    button = document.createElement('button');
  });

  suiteTeardown(function() {
    navigator.mozSettings = realMozSettings;
    navigator.mozMobileConnections = realMozMobileConnections;
    navigator.mozL10n = realMozL10n;
  });

  teardown(function() {
    MockNavigatorSettings.mTeardown();
  });

  var simulateClick = function() {
    var ev = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    button.dispatchEvent(ev);
  };

  var simulateContextMenu = function() {
    var ev = document.createEvent('MouseEvents');
    ev.initMouseEvent('contextmenu', true, false, window, 0, 0, 0, 0, 0,
                      false, false, false, false, 2, null);
    button.dispatchEvent(ev);
  };

  suite('<= 1 SIMs', function() {
    setup(function() {
      MockKeypadManager.phoneNumber = '';
      button = document.createElement('button');
      navigator.mozMobileConnections = [MockMozMobileConnection];
      subject.init(button, function() {
        return MockKeypadManager.phoneNumber;
      });
    });

    test('should not show SIM picker menu when long pressing', function() {
      MockKeypadManager.phoneNumber = '15555555555';
      var showSpy = this.sinon.spy(MockSimPicker, 'show');
      simulateContextMenu();
      sinon.assert.notCalled(showSpy);
    });

    test('should check the connection on the only SIM card', function() {
      this.sinon.spy(MockNavigatorSettings, 'createLock');
      this.sinon.spy(MockCallHandler, 'call');

      MockKeypadManager.phoneNumber = '0145345520';
      subject.makeCall();
      sinon.assert.calledWith(
        MockCallHandler.call, MockKeypadManager.phoneNumber, 0);

      MockMozMobileConnection.voice.emergencyCallsOnly = true;
      MockKeypadManager.phoneNumber = '112';
      subject.makeCall();
      sinon.assert.calledWith(
        MockCallHandler.call, MockKeypadManager.phoneNumber, 0);

      sinon.assert.notCalled(MockNavigatorSettings.createLock);
    });
  });

  suite('>= 2 SIMs', function() {
    setup(function() {
      MockKeypadManager.phoneNumber = '';

      button = document.createElement('button');

      navigator.mozMobileConnections =
        [this.sinon.stub(), MockMozMobileConnection];

      MockSimSettingsHelper._defaultCards.outgoingCall = 1;
      MockNavigatorSettings.mSyncRepliesOnly = true;
      MockNavigatorSettings.createLock().set(
        { 'ril.telephony.defaultServiceId': 1 }
      );

      subject.init(button, function() {
        return MockKeypadManager.phoneNumber;
      });
    });

    suiteTeardown(function() {
      MockNavigatorSettings.mSyncRepliesOnly = false;
    });

    test('should show SIM picker menu when long pressing', function() {
      MockKeypadManager.phoneNumber = '15555555555';
      var showSpy = this.sinon.spy(MockSimPicker, 'show');
      simulateContextMenu();
      sinon.assert.calledWith(showSpy, 1, MockKeypadManager.phoneNumber);
    });

    test('should fire SIM selected callback', function() {
      var callSpy = this.sinon.spy(MockCallHandler, 'call');
      MockKeypadManager.phoneNumber = '15555555555';
      simulateContextMenu();
      subject.makeCall(1);
      sinon.assert.calledWith(callSpy, '15555555555', 1);
    });

    test('should check the connection on the primary SIM card', function() {
      var callSpy = this.sinon.spy(MockCallHandler, 'call');
      MockKeypadManager.phoneNumber = '0145345520';
      subject.makeCall();
      MockNavigatorSettings.mReplyToRequests();
      sinon.assert.calledWith(
        callSpy, MockKeypadManager.phoneNumber, 1);

      MockMozMobileConnection.voice.emergencyCallsOnly = true;
      MockKeypadManager.phoneNumber = '112';
      subject.makeCall();
      MockNavigatorSettings.mReplyToRequests();
      sinon.assert.calledWith(
        callSpy, MockKeypadManager.phoneNumber, 1);
    });
  });

  suite('always ask', function() {
    setup(function() {
      MockKeypadManager.phoneNumber = '';
      navigator.mozMobileConnections =
        [this.sinon.stub(), MockMozMobileConnection];

      MockSimSettingsHelper._defaultCards.outgoingCall =
        SimSettingsHelper.ALWAYS_ASK_OPTION_VALUE;
      MockNavigatorSettings.mSyncRepliesOnly = true;
      MockNavigatorSettings.createLock().set(
        { 'ril.telephony.defaultServiceId':
          SimSettingsHelper.ALWAYS_ASK_OPTION_VALUE }
      );
    });

    suiteTeardown(function() {
      MockNavigatorSettings.mSyncRepliesOnly = false;
    });

    test('should show SIM picker when clicked', function() {
      MockKeypadManager.phoneNumber = '15555555555';
      var simPickerSpy = this.sinon.spy(MockSimPicker, 'show');
      simulateClick();
      sinon.assert.calledWith(
        simPickerSpy, SimSettingsHelper.ALWAYS_ASK_OPTION_VALUE,
        MockKeypadManager.phoneNumber);
    });
  });
});
