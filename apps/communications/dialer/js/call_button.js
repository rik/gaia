/* globals CallHandler, LazyLoader, SimPicker, SimSettingsHelper */
/* exported CallButton */

'use strict';

var CallButton = {
  _phoneNumberGetter: null,
  _imports: ['/shared/js/option_menu.js',
             '/shared/js/sim_picker.js',
             '/shared/js/sim_settings_helper.js',
             // document.getElementById('sim-picker')
             ],

  init: function cb_init(button, phoneNumberGetter) {
    // window.navigator.mozMobileConnections = [1, 2];
    // LazyLoader.load(this._imports, function() {
    //   SimPicker.show(1, '12345', function(cardIndex) {
    //                 console.log('WESH', cardIndex);
    //   });
    // });
    this._phoneNumberGetter = phoneNumberGetter;

    button.addEventListener('click', this._click.bind(this));

    if (window.navigator.mozMobileConnections &&
        window.navigator.mozMobileConnections.length > 1) {
      button.addEventListener('contextmenu', this._contextmenu.bind(this));
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

    if (window.navigator.mozMobileConnections &&
        window.navigator.mozMobileConnections.length === 1) {
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

  _contextmenu: function cb_contextmenu(event) {
    // Don't do anything, including preventDefaulting the event, if the phone
    // number is blank. We don't want to preventDefault because we want the
    // contextmenu event to generate a click.
    var phoneNumber = this._phoneNumberGetter();
    if (phoneNumber === '') {
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

    LazyLoader.load(['/shared/js/sim_settings_helper.js'], function() {
      if (cardIndex !== undefined) {
        CallHandler.call(phoneNumber, cardIndex);
      } else {
        SimSettingsHelper.getCardIndexFrom('outgoingCall', function(cardIndex) {
          CallHandler.call(phoneNumber, cardIndex);
        });
      }
    });
  },
};
