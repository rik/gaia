/* globals CallButton, MockSimPicker, MockSimSettingsHelper, MocksHelper,
           MockMozL10n, MockMozMobileConnection, MockNavigatorSettings,
           MockSettingsListener, SimSettingsHelper
*/

'use strict';

require('/dialer/test/unit/mock_lazy_loader.js');
require('/dialer/test/unit/mock_l10n.js');
require('/dialer/test/unit/mock_mozMobileConnection.js');
require('/shared/test/unit/mocks/mock_navigator_moz_settings.js');
require('/shared/test/unit/mocks/mock_sim_settings_helper.js');
require('/shared/test/unit/mocks/mock_sim_picker.js');
require('/shared/test/unit/mocks/mock_settings_listener.js');

require('/dialer/js/call_button.js');

var mocksHelperForCallButton = new MocksHelper([
  'LazyL10n',
  'LazyLoader',
  'SimSettingsHelper',
  'SimPicker',
  'SettingsListener'
]).init();

suite('call button', function() {
  var subject;
  var realMozSettings;
  var realMozMobileConnections;
  var realMozL10n;
  var phoneNumber;
  var button;
  var cardIndex;

  mocksHelperForCallButton.attachTestHelpers();

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

  var phoneNumberGetter = function() {
    return phoneNumber;
  };

  suiteSetup(function() {
    subject = CallButton;

    realMozSettings = navigator.mozSettings;
    navigator.mozSettings = MockNavigatorSettings;

    realMozMobileConnections = navigator.mozMobileConnections;
    navigator.mozMobileConnections = [];

    realMozL10n = navigator.mozL10n;
    navigator.mozL10n = MockMozL10n;
    navigator.mozL10n.localize = function() {};
  });

  suiteTeardown(function() {
    navigator.mozSettings = realMozSettings;
    navigator.mozMobileConnections = realMozMobileConnections;
    navigator.mozL10n = realMozL10n;
  });

  setup(function() {
    phoneNumber = '';
    navigator.mozMobileConnections =
      [this.sinon.stub(), MockMozMobileConnection];
    button = document.createElement('button');
    subject.init(button, phoneNumberGetter);
  });

  teardown(function() {
    MockNavigatorSettings.mTeardown();
  });

  suite('<= 1 SIMs', function() {
    setup(function() {
      navigator.mozMobileConnections = [MockMozMobileConnection];
      subject.init(button, phoneNumberGetter);
    });

    test('should not show SIM picker menu when long pressing', function() {
      phoneNumber = '15555555555';
      var showSpy = this.sinon.spy(MockSimPicker, 'show');
      simulateContextMenu();
      sinon.assert.notCalled(showSpy);
    });
  });

  suite('>= 2 SIMs', function() {
    suite('SIM 2 preferred', function() {
      setup(function() {
        cardIndex = 1;
        MockSimSettingsHelper._defaultCards.outgoingCall = cardIndex;
        subject.init(button, phoneNumberGetter);
      });

      test('should show SIM picker menu when long pressing', function() {
        phoneNumber = '15555555555';
        var showSpy = this.sinon.spy(MockSimPicker, 'show');
        simulateContextMenu();
        sinon.assert.calledWith(showSpy, cardIndex, phoneNumber);
      });

      test('should fire SIM selected callback', function() {
        var showSpy = this.sinon.spy(MockSimPicker, 'show');
        subject.init(button, phoneNumberGetter, showSpy);

        phoneNumber = '15555555555';
        simulateContextMenu();
        subject.makeCall(cardIndex);
        sinon.assert.calledWith(showSpy, cardIndex, phoneNumber);
      });

      test('should check the connection on the primary SIM card', function() {
        var callStub = this.sinon.stub();
        subject.init(button, phoneNumberGetter, callStub);

        phoneNumber = '0145345520';
        subject.makeCall();
        sinon.assert.calledWith(callStub, phoneNumber, cardIndex);
      });
    });

    suite('always ask', function() {
      setup(function() {
        cardIndex = SimSettingsHelper.ALWAYS_ASK_OPTION_VALUE;
        MockSimSettingsHelper._defaultCards.outgoingCall = cardIndex;
      });

      test('should show SIM picker when clicked', function() {
        phoneNumber = '15555555555';
        var showSpy = this.sinon.spy(MockSimPicker, 'show');
        simulateClick();
        sinon.assert.calledWith(showSpy, cardIndex, phoneNumber);
      });
    });
  });

  suite('UI tests', function(){
    var simIndication;

    var initWithIndication = function() {
      document.body.innerHTML =
        '<div id="container"><div class="js-sim-indication"></div></div>';
      button = document.getElementById('container');
      simIndication = button.querySelector('.js-sim-indication');
    };

    var shouldNotShowAnIndicator = function() {
      var localizeSpy = this.sinon.spy(MockMozL10n, 'localize');
      subject.init(button, phoneNumberGetter);
      sinon.assert.notCalled(localizeSpy);
    };

    setup(function() {
      cardIndex = 0;
      MockSimSettingsHelper._defaultCards.outgoingCall = cardIndex;

      navigator.mozMobileConnections =
        [this.sinon.stub(), MockMozMobileConnection];
    });

    suite('with SIM indication', function() {
      setup(function() {
        initWithIndication();
        subject.init(button, phoneNumberGetter);
      });

      test('button should have has-preferred-sim class', function() {
        assert.isTrue(button.classList.contains('has-preferred-sim'));
      });

      test('has a localized SIM indicator', function() {
        var localizeSpy = this.sinon.spy(MockMozL10n, 'localize');
        subject.init(button, phoneNumberGetter);
        sinon.assert.calledWith(localizeSpy, simIndication, 'sim-picker-button',
                                {n: cardIndex+1});
      });

      test('indicator changes when settings change', function() {
        var cardSpy = this.sinon.spy(MockSimSettingsHelper, 'getCardIndexFrom');
        var localizeSpy = this.sinon.spy(MockMozL10n, 'localize');

        MockSimSettingsHelper._defaultCards.outgoingCall = 1;
        MockSettingsListener.mTriggerCallback(
          'ril.telephony.defaultServiceId', 1);

        sinon.assert.calledOnce(cardSpy);
        sinon.assert.calledWith(localizeSpy, simIndication, 'sim-picker-button',
                                {n: 2});
      });

      test('should hide indicators when changing to always ask', function() {
        MockSimSettingsHelper._defaultCards.outgoingCall =
          SimSettingsHelper.ALWAYS_ASK_OPTION_VALUE;
        MockSettingsListener.mTriggerCallback(
          'ril.telephony.defaultServiceId',
          SimSettingsHelper.ALWAYS_ASK_OPTION_VALUE);

        assert.isFalse(button.classList.contains('has-preferred-sim'));
        assert.isTrue(simIndication.classList.contains('hide'));
      });
    });

    suite('without SIM indication', function() {
      setup(function() {
        document.body.innerHTML =
          '<div id="container"></div>';
        button = document.getElementById('container');
        simIndication = button.querySelector('.js-sim-indication');

        subject.init(button, phoneNumberGetter);
      });

      test('button should have has-preferred-sim class', function() {
        assert.isTrue(button.classList.contains('has-preferred-sim'));
      });

      test('should not show a current SIM indicator', shouldNotShowAnIndicator);
    });

    suite('<= 1 SIMs', function() {
      setup(function() {
        navigator.mozMobileConnections = [MockMozMobileConnection];
        initWithIndication();
      });

      test('button should not have has-preferred-sim class', function() {
        assert.isFalse(button.classList.contains('has-preferred-sim'));
      });

      test('should not show a current SIM indicator', shouldNotShowAnIndicator);
    });
  });
});
