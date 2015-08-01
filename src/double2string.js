/*jshint bitwise:false, browserify:true */

'use strict';

// TODO: Merge with format.js or pin function to format.js
//

var BigInt = require('./bigint.js').BigInt;

var getSign = function(number) {
    if (number > 0) {
        return 0;
    }
    else if (number < 0) {
        return 1;
    }
    else {
        // differentiate between +0 and -0
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

    // double exponent is 11bit unsigned number.
    // real exponent is computed as (11BIT_UNSIGNED_EXPONENT - 1023)
    // if we want 11BIT_UNSIGNED_EXPONENT we must add 1023 to real exponent:
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
        // added number doesn't change mantissa bits
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

var double2bits = exports.double2bits = function(number) {
    return {
        sign: getSign(number),
        exponent: getExponent(number),
        mantissa: getMantissa(number)
    };
};

var ceil10exp = function(r, mplus, s) {
    // find min k such that:
    // (r+mplus)/s <= 10^k
    //
    // min_k {{ (r+mplus) <= 10^k * s }}
    
    var result = 0;
    var TEN = BigInt.of(10);

    var rmplus = r.add(mplus);

    if (rmplus.isLowerOrEqual(s)) {
        while (rmplus.isLowerOrEqual(s)) {
            rmplus = rmplus.mul(TEN);
            result -= 1;
        }

        if (!rmplus.isLowerOrEqual(s)) {
            result += 1;
        }
    }
    else {
        while (s.isLowerThan(rmplus)) {
            result += 1;
            s = s.mul(TEN);
        }
    }

    return result;
};

var isEven = function(n) {
    return (n % 2 === 0);
};

// returns pair: { digits: [d1, d2, ...], k }
// that represent number: 0.d1d2... x 10^k
//
var getDoubleDigits = function(number) {
    var bits = double2bits(number);

    var includeEnds = isEven(bits.mantissa);

    // 2^52 1 and 51 zeros
    var ONE = BigInt.one();
    var TWO = BigInt.of(2);
    var TEN = BigInt.of(10);
    var TWO_EXP_52 = TWO.pow(BigInt.of(52));
    var TWO_EXP_53 = TWO.pow(BigInt.of(53));

    var e = BigInt.of(bits.exponent === 0 ? -1074 : bits.exponent - 1075),
        f = BigInt
                .of(bits.mantissa)
                .add(bits.exponent === 0 ? BigInt.zero() : TWO_EXP_52),
        e1 = e.add(ONE);

    var r, s, mplus, mminus;

    if (e.isGreaterOrEqual(BigInt.zero())) {
        if (!f.isEqual(TWO_EXP_53)) {
            r = f.mul(TWO.pow(e)).mul(TWO);
            s = TWO;
            mplus = mminus = TWO.pow(e);
        }
        else {
            r = f.mul(TWO.pow(e1)).mul(TWO);
            s = TWO.mul(TWO);
            mplus = TWO.pow(e1);
            mminus = TWO.pow(e);
        }
    }
    else {
        if (bits.exponent === 0 || !f.isEqual(TWO_EXP_53)) {
            r = f.mul(TWO);
            s = TWO.pow(e.negate()).mul(TWO);
            mplus = mminus = ONE;
        }
        else {
            r = f.mul(TWO).mul(TWO);
            s = TWO.pow(e1).mul(TWO);
            mplus = TWO;
            mminus = ONE;
        }
    }

    var k = ceil10exp(r, mplus, s);

    if (k >= 0) {
        s = s.mul(TEN.pow(BigInt.of(k)));
    }
    else {
        var tenMK = TEN.pow(BigInt.of(-k));
        r = r.mul(tenMK);
        mplus = mplus.mul(tenMK);
        mminus = mminus.mul(tenMK);
    }

    var digits = [];
    var cond1, cond2;
    var divMod;

    while(true) {
        divMod = r.mul(TEN).divMod(s);

        var digit = divMod.div.toDecimalString();
        digits.push(Number(digit));

        r = divMod.mod;
        mplus = mplus.mul(TEN);
        mminus = mminus.mul(TEN);

        cond1 = (includeEnds ? r.isLowerOrEqual(mminus) : r.isLowerThan(mminus));
        cond2 = (includeEnds ? s.isLowerOrEqual(r.add(mplus)) : s.isLowerThan(r.add(mplus)));

        if (cond1 || cond2) {
            break;
        }
    }

    if (!cond1 && cond2) {
        digits[digits.length - 1] += 1;
    }
    else if (cond1 && cond2) {
        var tmp = r.mul(TWO);
        if (s.isLowerThan(tmp)) {
            digits[digits.length - 1] += 1;
        }
    }

    return {
        digits: digits,
        k: k
    };
};

// returns string representation of number
// @fractionDigits - number of digits printed after decimal point
exports.double2string = function(number) {
    return getDoubleDigits(number).digits;
};

