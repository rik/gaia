/* global MockContacts, MockL10n, Utils */

'use strict';

require('/shared/test/unit/mocks/dialer/mock_contacts.js');
require('/shared/test/unit/mocks/mock_l10n.js');

require('/shared/js/dialer/utils.js');


suite('dialer/utils', function() {
  var realL10n;
  var subject;
  var number = '555-555-555-555';


  suiteSetup(function() {
    realL10n = navigator.mozL10n;
    navigator.mozL10n = MockL10n;
    subject = Utils;
  });

  suiteTeardown(function() {
    navigator.mozL10n = realL10n;
  });

  suite('Utility library', function() {
    test('#additional info WITHOUT carrier', function() {
      MockContacts.mCarrier = null; // No carrier
      MockContacts.findByNumber(number, function(contact, matchingTel) {
        var additionalInfo = subject.getPhoneNumberAdditionalInfo(matchingTel,
          contact, number);
        assert.equal(MockContacts.mType, additionalInfo);
      });
    });

    test('#additional info WITH carrier', function() {
      MockContacts.mCarrier = 'carrier'; // Carrier value
      MockContacts.findByNumber(number, function(contact, matchingTel) {
        var additionalInfo = subject.getPhoneNumberAdditionalInfo(matchingTel,
          contact, number);
        assert.equal(MockContacts.mType + ', ' +
          MockContacts.mCarrier, additionalInfo);
      });
    });

    test('phone number and type', function() {
      MockContacts.findByNumber(number, function(contact, matchingTel) {
        var additionalInfo = subject.getPhoneNumberAndType(
          matchingTel, contact, number);
        assert.equal(MockContacts.mType + ', ' + number,
                     additionalInfo);
      });
    });

    test('should not translate custom types', function() {
      this.sinon.stub(navigator.mozL10n, 'get')
        .withArgs('totally custom').returns('');
      MockContacts.mCarrier = 'carrier';
      MockContacts.mType = 'totally custom';

      MockContacts.findByNumber(number, function(contact, matchingTel) {
        var additionalInfo = subject.getPhoneNumberAdditionalInfo(matchingTel,
          contact, number);
        assert.equal('totally custom, ' +
          MockContacts.mCarrier, additionalInfo);
      });
    });
  });

  suite('prettyDuration', function() {
    test('formats as minutes if less than one hour', function() {
      var pretty = Utils.prettyDuration(60 * 60 *1000 - 1);
      assert.equal(pretty, 'callDurationMinutes{"h":"00","m":59,"s":59}');
    });

    test('formats with hours if more than one hour', function() {
      var pretty = Utils.prettyDuration(60 * 60 * 1000);
      assert.equal(pretty, 'callDurationHours{"h":"01","m":"00","s":"00"}');
    });

    test('Single digits are padded', function() {
      var hours = 2;
      var minutes = 4;
      var seconds = 7;
      var duration = hours * 60 * 60 + minutes * 60 + seconds;
      var pretty = Utils.prettyDuration(duration * 1000);
      assert.equal(pretty, 'callDurationHours{"h":"02","m":"04","s":"07"}');
    });
  });
});
