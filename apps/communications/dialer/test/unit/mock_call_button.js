/* globals CallHandler, KeypadManager */
/* exported MockCallButton */

'use strict';

var MockCallButton = {
  init: function() { },
  makeCall: function() {
    CallHandler.call(KeypadManager.phoneNumber);
  }
};
