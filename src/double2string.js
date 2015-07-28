/*jshint bitwise:false */

(function(exports) {
    'use strict';

    // TODO: Merge with format.js or pin function to format.js

    var getSign = function(number) {
        if (number > 0) {
            return 0;
        }
        else if (number < 0) {
            return 1;
        }
        else {
            var inf = 1 / number;
            return (inf === Number.POSITIVE_INFINITY ? 0 : 1);
        }
    };

    var exactLog2 = function(number) {
        number = Math.abs(number);

        var exponent = 0;

        if (number >= 1) {
            while (number >= 2) {
                number /= 2;
                exponent += 1;
            }
        }
        else {
            while (number < 1) {
                number *= 2;
                exponent -= 1;
            }
        }

        return exponent;
    };

    var getExponent = function(number) {
        if (number === 0) {
            return 0;
        }

        if (!isFinite(number)) {
            // special value for nan & inf's
            return 0x7ff;
        }

        var exponent = exactLog2(number);

        // exponent = realExponent - 1023
        exponent += 1023;

        // exponent can be negative in case of degenerated number
        // (without leading 1 in mantissa)
        exponent = Math.max(0, exponent);

        return exponent;
    };

    var getMantissa = function(number) {
        if (isNaN(number)) {
            return 0xfffffffffffff;
        }

        if (!isFinite(number)) {
            return 0;
        }

        if (number === 0) {
            return 0;
        }

        if (number < 0) {
            number = -number;
        }

        var log2 = exactLog2(number);

        var denormalized = (log2 <= -1023);
        if (denormalized) {
            // add artificial 1 to mantissa
            number += Math.pow(2, -1022);
            log2 = -1022;
        }

        number /= Math.pow(2, log2);

        // number have form 1.01001110111
        // if we multiply it by 2^52 we get integer value
        // with same bits as mantissa (with leading 1)
        number *= Math.pow(2, 52);

        // remove leading one
        number -= Math.pow(2, 52);

        return number;
    };

    exports.double2bits = function(number) {
        return {
            sign: getSign(number),
            exponent: getExponent(number),
            mantissa: getMantissa(number)
        };
    };

    exports.double2string = function() {
        throw new Error('not impl.');
    };

}(this));
 
