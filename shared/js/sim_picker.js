/* global LazyL10n */
/* exported SimPicker */

'use strict';

(function(exports) {
  /*
   * SimPicker is a helper to dynamically generate menus for selecting SIM
   * cards when making calls, sending SMS, etc.
   */
  var SimPicker = {
    show: function hk_show(defaultCardIndex, phoneNumber, simSelectedCallback) {
      var self = this;
      this._simSelectedCallback = simSelectedCallback;

      LazyL10n.get(function() {
        var localize = navigator.mozL10n.localize;
        localize(document.getElementById('sim-picker-dial-via'),
                 'sim-picker-dial-via', {phoneNumber: phoneNumber});

        var templateNode = document.getElementById(
          'sim-picker-button-template');
        for (var i = 0; i < window.navigator.mozMobileConnections.length; i++) {
          var clonedNode = templateNode.cloneNode(true);
          clonedNode.dataset.cardIndex = i;
          localize(clonedNode.querySelector('span'), 'sim-picker-button',
                   {n: i + 1});
          if (i === defaultCardIndex) {
            clonedNode.classList.add('is-default');
          }
          templateNode.parentNode.insertBefore(clonedNode, templateNode);
        }
        templateNode.remove();

        var simPickerElt = document.getElementById('sim-picker');
        simPickerElt.addEventListener('click', self);
        simPickerElt.hidden = false;
      });
    },

    handleEvent: function(e) {
      if (e.target.nodeName !== 'BUTTON') {
        return;
      }

      if (e.target.dataset.cardIndex) {
        this._simSelectedCallback(e.target.dataset.cardIndex);
      }
      document.getElementById('sim-picker').hidden = true;
    }
  };


  exports.SimPicker = SimPicker;

})(window);
