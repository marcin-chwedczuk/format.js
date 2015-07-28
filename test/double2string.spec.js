(function() {
    'use strict';

    var chai = require('chai');
    // var expect = chai.expect;
    chai.should();

    var d2b = require('../src/double2string.js').double2bits;
    
    var bin = function(b) {
        return parseInt(b, 2);
    };

    describe('double2bits', function() {
        it ('correctly gets sign of double', function() {
            d2b(+1).sign.should.equal(0);
            d2b(-1).sign.should.equal(1);

            d2b(+0).sign.should.equal(0);
            d2b(-0).sign.should.equal(1);
        });

        it('correctly gets exponent of double', function() {
            d2b(12345).exponent.should.equal(bin('10000001100'));
            d2b(0).exponent.should.equal(0);
            d2b(NaN).exponent.should.equal(2047);
            d2b(Infinity).exponent.should.equal(2047);
            d2b(-Infinity).exponent.should.equal(2047);

            d2b(1.3).exponent.should.equal(bin('01111111111'));
            d2b(8).exponent.should.equal(bin('10000000010'));
            d2b(1797.5814983742312).exponent.should.equal(bin('10000001001'));

            d2b(Number.MIN_VALUE).exponent.should.equal(0);
            d2b(Number.MAX_VALUE).exponent.should.equal(bin('11111111110'));

            d2b(119964.78068221989).exponent.should.equal(bin('10000001111'));
        });

        it('correctly gets mantissa bits of double', function() {
            d2b(12345).mantissa.should.equal(
                bin('1000000111001000000000000000000000000000000000000000'));

            d2b(0).mantissa.should.equal(0);
            
            d2b(NaN).mantissa.should.equal(
                bin('1111111111111111111111111111111111111111111111111111'));

            d2b(Infinity).mantissa.should.equal(0);
            d2b(-Infinity).mantissa.should.equal(0);

            d2b(1.3).mantissa.should.equal(
                bin('0100110011001100110011001100110011001100110011001101'));

            d2b(0.1).mantissa.should.equal(
                bin('1001100110011001100110011001100110011001100110011010'));

            d2b(8).mantissa.should.equal(0);
            d2b(1797.5814983742312).mantissa.should.equal(
                bin('1100000101100101001101110100010011110101000000000000'));

            d2b(Number.MIN_VALUE).mantissa.should.equal(
                bin('0000000000000000000000000000000000000000000000000001'));

            d2b(Number.MAX_VALUE).mantissa.should.equal(
                bin('1111111111111111111111111111111111111111111111111111'));

            d2b(119964.78068221989).mantissa.should.equal(
                bin('1101010010011100110001111101101011001010001110110000'));
        });
    });

}());

 
