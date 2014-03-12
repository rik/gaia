/* globals LazyLoader, SettingsListener, SimPicker, SimSettingsHelper */
/* exported CallButton */

'use strict';

var CallButton = {
  _button: null,
  _phoneNumberGetter: null,
  _callCallback: null,

  _imports: ['/shared/js/sim_picker.js',
             '/shared/js/sim_settings_helper.js',
             '/shared/js/settings_listener.js'],

  init: function cb_init(button, phoneNumberGetter, callCallback) {
    this._button = button;
    this._phoneNumberGetter = phoneNumberGetter;
    this._callCallback = callCallback;

    button.addEventListener('click', this._click.bind(this));

    if (true || window.navigator.mozMobileConnections &&
        window.navigator.mozMobileConnections.length > 1) {
      button.addEventListener('contextmenu', this._contextmenu.bind(this));

      var self = this;
      LazyLoader.load(this._imports, function() {
        self._simIndication = button.querySelector('.js-sim-indication');
        SettingsListener.observe(
          'ril.telephony.defaultServiceId', 0, self._updateUI.bind(self));
        // self._updateUI();
      });
    }
  },

  _click: function cb_click(event) {
    if (event) {
      event.preventDefault();
    }

    var phoneNumber = this._phoneNumberGetter();
    if (!window.navigator.mozMobileConnections || phoneNumber === '') {
      return;
    }

    if (window.navigator.mozMobileConnections.length === 1) {
      this.makeCall();
      return;
    }

    var self = this;
    LazyLoader.load(this._imports, function() {
      SimSettingsHelper.getCardIndexFrom('outgoingCall', function(cardIndex) {
        // The user has requested that we ask them every time for this key,
        // so we prompt them to pick a SIM even when they only click.
        if (cardIndex == SimSettingsHelper.ALWAYS_ASK_OPTION_VALUE) {
          SimPicker.show(cardIndex, phoneNumber, self.makeCall.bind(self));
        } else {
          self.makeCall();
        }
      });
    });
  },

  _updateUI: function cb_updateUI() {
    var self = this;
    SimSettingsHelper.getCardIndexFrom('outgoingCall', function(cardIndex) {
      console.log('WESH');
      if (cardIndex >= 0) {
        if (self._simIndication) {
          navigator.mozL10n.localize(self._simIndication,
                                     'sim-picker-button', {n: cardIndex+1});
          self._simIndication.classList.remove('hide');
        }

        document.body.classList.add('has-preferred-sim');
      } else {
        if (self._simIndication) {
          self._simIndication.classList.add('hide');
        }

        document.body.classList.remove('has-preferred-sim');
      }
    });
  },

  _contextmenu: function cb_contextmenu(event) {
    // Don't do anything, including preventDefaulting the event, if the phone
    // number is blank. We don't want to preventDefault because we want the
    // contextmenu event to generate a click.
    var phoneNumber = this._phoneNumberGetter();
    if (!window.navigator.mozMobileConnections ||
        window.navigator.mozMobileConnections.length === 1 ||
        phoneNumber === '') {
      return;
    }

    if (event) {
      event.preventDefault();
    }

    var self = this;
    LazyLoader.load(this._imports, function() {
      SimSettingsHelper.getCardIndexFrom('outgoingCall', function(cardIndex) {
        SimPicker.show(cardIndex, phoneNumber, self.makeCall.bind(self));
      });
    });
  },

  makeCall: function cb_makeCall(cardIndex) {
    var phoneNumber = this._phoneNumberGetter();
    if (phoneNumber === '') {
      return;
    }

    var self = this;
    LazyLoader.load(['/shared/js/sim_settings_helper.js'], function() {
      if (cardIndex !== undefined) {
        self._callCallback(phoneNumber, cardIndex);
      } else {
        SimSettingsHelper.getCardIndexFrom('outgoingCall', function(cardIndex) {
          self._callCallback(phoneNumber, cardIndex);
        });
      }
    });
  },
};
