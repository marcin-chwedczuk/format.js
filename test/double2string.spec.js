/*jshint bitwise:false */

(function() {
    'use strict';

    var chai = require('chai');
    // var expect = chai.expect;
    chai.should();

    var module = require('../src/double2string.js');
    var BigInt = require('../src/bigint.js').BigInt;

    module.BigInt = BigInt;

    var d2b = module.double2bits;
    var d2s = module.double2string;
    var d2s2 = module.double2string2;
    var dexp = module.double2string2exp;
    
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

        it('passes stress test', function() {
            // this test is implementation and machine dependent
            var buff = new ArrayBuffer(8);
            var doubleView = new Float64Array(buff);
            var intView = new Int32Array(buff);

            var _32zero = new Array(33).join('0');

            var MAX_TESTS = 10000;
            for (var i = 0; i < MAX_TESTS; i += 1) {
                var sign = (Math.random() > 0.5 ? 1 : -1);
                var mantissa = 1.0 + Math.random();
                var exp = 1022 - (2044 * Math.random());

                var f = sign * Math.pow(2, exp) * mantissa;

                doubleView[0] = f;

                var expectedBits = 
                    (_32zero + (intView[1] >>> 0).toString(2)).slice(-32) +
                    (_32zero + (intView[0] >>> 0).toString(2)).slice(-32);

                var tmp = d2b(f);
                var actualBits = tmp.sign.toString(2) + 
                        (_32zero + (tmp.exponent >>> 0).toString(2)).slice(-11) +
                        (_32zero + _32zero + tmp.mantissa.toString(2).replace('-','')).slice(-52);

                actualBits.should.equal(expectedBits, "value not equal for number: " + f);
            }

        });
    });

    describe('double2string', function() {
        it('returns NaN for NaN number', function() {
            d2s(NaN).should.equal('NaN');
        });

        it('returns Inf for positive infinity, and -Inf for negative infinity', function() {
            d2s(Number.POSITIVE_INFINITY).should.equal('Inf');
            d2s(Number.NEGATIVE_INFINITY).should.equal('-Inf');
        });

        it('returns "0" for zero and "-0" for minus zero', function() {
            d2s(0).should.equal('0');
            d2s(-0).should.equal('-0');
        });

        it('correctly prints integers', function() {
            d2s(12345).should.equal('12345');
            d2s(101).should.equal('101');

            d2s(32).should.equal('32');
            d2s(-32).should.equal('-32');

            d2s(-8837129).should.equal('-8837129');
        });

        it('correctly prints number with fraction part', function() {
            d2s(12345.554431).should.equal('12345.554431');

            d2s(0.12345).should.equal('0.12345');

            d2s(-0.3).should.equal('-0.3');
        });

        it('correctly prints min and max double values', function() {
            var _323zeros = new Array(323+1).join('0');
            var _292zeros = new Array(292+1).join('0');

            d2s(Number.MIN_VALUE).should.equal('0.' + _323zeros + '5');
            d2s(Number.MAX_VALUE).should.equal('17976931348623157' + _292zeros);
        });

        it('correctly prints min and max integer values', function() {
            d2s(9007199254740991).should.equal('9007199254740991');
            d2s(-9007199254740991).should.equal('-9007199254740991');
        });

        it('correctly prints PI and E numbers', function() {
            d2s(Math.PI).should.equal('3.141592653589793');
            d2s(Math.E).should.equal('2.718281828459045');
        });

        it('passes stres test', function() {
            for (var i = 0; i < 500; i += 1) {
                var r = Math.random();
                
                var rstr = r.toString();
                if (rstr.indexOf('E') !== (-1) || rstr.indexOf('e') !== (-1)) {
                    // skip numbers in format 1.3543e+39
                    continue;
                }

                Number(d2s(r)).should.equal(r);
            }
        });

        it('allows precision to be specified', function() {
            d2s(3344, 4).should.equal('3344.0000');
            d2s(12.34, 4).should.equal('12.3400');
            d2s(Math.PI, 3).should.equal('3.142');
            d2s(0.3322112233, 5).should.equal('0.33221');
            
            d2s(0,3).should.equal('0.000');
        });

        it('correctly rounds numbers when precision is specified', function() {
            d2s(3.34, 1).should.equal('3.3');
            d2s(3.53, 1).should.equal('3.5');
            d2s(3.55, 1).should.equal('3.6');
            d2s(3.59, 1).should.equal('3.6');
            d2s(3.54, 1).should.equal('3.5');

            d2s(-4.778, 2).should.equal('-4.78');
            d2s(-4.223, 2).should.equal('-4.22');

            d2s(0.6898480195086449, 3).should.equal('0.690');
        });

        it('passes precision stres test', function() {
            for (var i = 0; i < 500; i += 1) {
                var r = Math.random();
                
                var rstr = r.toFixed(3);
                if (rstr.indexOf('E') !== (-1) || rstr.indexOf('e') !== (-1)) {
                    // skip numbers in format 1.3543e+39
                    continue;
                }

                d2s(r, 3).should.equal(rstr, 'r = ' + r);
            }
        });

    });

    describe('double2string2', function() {
        it('returns NaN for NaN number', function() {
            d2s2(NaN).should.equal('NaN');
        });

        it('returns Inf for positive infinity, and -Inf for negative infinity', function() {
            d2s2(Number.POSITIVE_INFINITY).should.equal('Inf');
            d2s2(Number.NEGATIVE_INFINITY).should.equal('-Inf');
        });

        it('returns "0" for zero and "-0" for minus zero', function() {
            d2s2(0, 0).should.equal('0');
            d2s2(-0, 0).should.equal('-0');
        });

        it('correctly prints integers', function() {
            d2s2(12345, 0).should.equal('12345');
            d2s2(101, 0).should.equal('101');

            d2s2(32, 0).should.equal('32');
            d2s2(-32, 0).should.equal('-32');

            d2s2(-8837129, 0).should.equal('-8837129');
        });

        it('correctly prints number with fraction part', function() {
            d2s2(12345.554431, 6).should.equal('12345.554431');

            d2s2(0.12345, 5).should.equal('0.12345');

            d2s2(-0.3, 1).should.equal('-0.3');
        });

        it('correctly prints min and max double values', function() {
            var _323zeros = new Array(323+1).join('0');

            d2s2(Number.MIN_VALUE, 324).should.equal('0.' + _323zeros + '5');
            d2s2(Number.MAX_VALUE, 0).should.equal(
                '17976931348623157081452742373170435679807056752584499' +
                '65989174768031572607800285387605895586327668781715404' +
                '58953514382464234321326889464182768467546703537516986' +
                '04991057655128207624549009038932894407586850845513394' +
                '23045832369032229481658085593321233482747978262041447' +
                '23168738177180919299881250404026184124858368');
        });

        it('correctly prints min and max integer values', function() {
            d2s2(9007199254740991, 0).should.equal('9007199254740991');
            d2s2(-9007199254740991, 0).should.equal('-9007199254740991');
        });

        it('correctly prints PI and E numbers', function() {
            d2s2(Math.PI, 15).should.equal('3.141592653589793');
            d2s2(Math.E, 15).should.equal('2.718281828459045');
        });

        it('passes stres test', function() {
            for (var i = 0; i < 500; i += 1) {
                var r = Math.random();
                
                var rstr = r.toString();
                if (rstr.indexOf('E') !== (-1) || rstr.indexOf('e') !== (-1)) {
                    // skip numbers in format 1.3543e+39
                    continue;
                }
                
                var precision = rstr.length - rstr.indexOf('.') - 1;

                d2s2(r, precision).should.equal(rstr);
            }
        });

        it('allows precision to be specified', function() {
            d2s2(3344, 4).should.equal('3344.0000');
            d2s2(12.34, 4).should.equal('12.3400');
            d2s2(Math.PI, 3).should.equal('3.142');
            d2s2(0.3322112233, 5).should.equal('0.33221');
            
            d2s2(0,3).should.equal('0.000');
        });

        it('correctly rounds numbers when precision is specified', function() {
            d2s2(3.34, 1).should.equal('3.3');
            d2s2(3.53, 1).should.equal('3.5');
            
            // this one is interesting, due to rounding errors
            // 3.55 is actually represented as 3.5499999...99
            // this is behaviour exposed by toFixed(1) and C' printf.
            d2s2(3.55, 1).should.equal('3.5');

            d2s2(3.59, 1).should.equal('3.6');
            d2s2(3.54, 1).should.equal('3.5');

            d2s2(-4.778, 2).should.equal('-4.78');
            d2s2(-4.223, 2).should.equal('-4.22');

            d2s2(0.6898480195086449, 3).should.equal('0.690');
        });

        it('passes precision stres test', function() {
            for (var i = 0; i < 500; i += 1) {
                var r = Math.random();
                
                var rstr = r.toFixed(3);
                if (rstr.indexOf('E') !== (-1) || rstr.indexOf('e') !== (-1)) {
                    // skip numbers in format 1.3543e+39
                    continue;
                }

                d2s2(r, 3).should.equal(rstr, 'r = ' + r);
            }
        });
    });

    describe('double2string2exp', function() {
        it('prints numbers in scientific notation', function() {
            dexp('e', 102, 2)
                .should.equal('1.02e+02');

            dexp('e', 133.55, 4)
                .should.equal('1.3355e+02');

            dexp('e', 1, 4)
                .should.equal('1.0000e+00');

            dexp('e', 1.23456, 2)
                .should.equal('1.23e+00');

            dexp('e', 0.01, 4)
                .should.equal('1.0000e-02');

            dexp('e', 0.1234, 3)
                .should.equal('1.234e-01');

            dexp('e', 0.0019999, 3)
                .should.equal('2.000e-03');

            dexp('e', 0, 3)
                .should.equal('0.000e+00');
        });

        it('correctly rounds numbers', function() {
            dexp('E', 166, 1)
                .should.equal('1.7E+02');

            dexp('E', 9.999, 2)
                .should.equal('1.00E+01');

            dexp('E', 1.123, 2)
                .should.equal('1.12E+00');
        });

        it('correctly handles negative numbers', function() {
            dexp('e', -1234, 3)
                .should.equal('-1.234e+03');

            dexp('e', -0.0038847, 2)
                .should.equal('-3.88e-03');
        });

        it('passes stress test', function() {
            for (var i = 0; i < 1000; i += 1) {
                var r = Math.random();

                var expString = dexp('e', r, 16);
                r.should.equal(Number(expString));
            }
        });
    });

}());

 
