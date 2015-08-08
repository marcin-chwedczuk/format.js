/*jshint bitwise:false, browserify:true */

'use strict';

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
var getDoubleDigits = exports.getDoubleDigits = (function() {
    // 2^52 1 and 51 zeros
    var ZERO = BigInt.zero();
    var ONE = BigInt.one();
    var TWO = BigInt.of(2);
    var TEN = BigInt.of(10);
    var TWO_EXP_52 = TWO.pow(BigInt.of(52));
    var TWO_EXP_53 = TWO.pow(BigInt.of(53));

    return function(number) {
        if (number === 0) {
            return {
                sign: (1 / number === Number.POSITIVE_INFINITY ? 0 : 1),
                k: 0,
                digits: []
            };
        }

        var bits = double2bits(number);

        var includeEnds = isEven(bits.mantissa);

        if (bits.sign) {
            number = -number;
        }

        var e = BigInt.of(bits.exponent === 0 ? -1074 : bits.exponent - 1075),
            f = BigInt
                    .of(bits.mantissa)
                    .add(bits.exponent === 0 ? ZERO : TWO_EXP_52),
            e1 = e.add(ONE);

        var r, s, mplus, mminus;

        if (e.isGreaterOrEqual(ZERO)) {
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
            k: k,
            sign: bits.sign
        };
    };
}());

var padZeroLeft = function(array, numberOfZeros) {
    array = array.slice();

    for (var i = 0; i < numberOfZeros; i += 1) {
        array.unshift(0);
    }

    return array;
};

var padZeroRight = function(array, numberOfZeros) {
    array = array.slice();

    for (var i = 0; i < numberOfZeros; i += 1) {
        array.push(0);
    }

    return array;
};

var roundUp = function(integerDigits, fractionDigits) {
    var i, carry = 1;
    
    for (i = fractionDigits.length-1; carry && (i >= 0); i -= 1) {
        fractionDigits[i] += carry;
        if (fractionDigits[i] >= 10) {
            fractionDigits[i] -= 10;
            carry = 1;
        }
        else {
            carry = 0;
        }
    }

    for (i = 0; carry && (i < integerDigits.length); i += 1) {
        integerDigits[i] += carry;
        if (integerDigits[i] >= 10) {
            integerDigits[i] -= 10;
            carry = 1;
        }
        else {
            carry = 0;
        }
    }

    if (carry) {
        integerDigits.unshift(1);
    }
};

// returns string representation of number
// @precision - number of digits printed after decimal point
exports.double2string = function(number, precision) {
    if (isNaN(number)) {
        return 'NaN';
    }

    if (!isFinite(number)) {
        return (number > 0 ? 'Inf' : '-Inf');
    }

    // 0.d1d2d3d4... x 10^k
    var result = getDoubleDigits(number);

    var integerDigits, fractionDigits;

    if (result.k < 0) {
        integerDigits = [0];
        fractionDigits = padZeroLeft(result.digits, -result.k);
    }
    else {
        if (result.k > result.digits.length) {
            result.digits = padZeroRight(result.digits, result.k - result.digits.length); 
        }

        integerDigits = (result.k ? result.digits.slice(0, result.k) : [0]);
        fractionDigits = result.digits.slice(result.k);
    }

    if (typeof(precision) !== "undefined") {
        if (fractionDigits.length < precision) {
            fractionDigits = padZeroRight(fractionDigits, precision - fractionDigits.length);
        }
        else {
            // rounding
            var needsRoundingUp = 
                (fractionDigits.length > precision) && 
                (fractionDigits[precision] >= 5);

            fractionDigits = fractionDigits.slice(0, precision);

            if (needsRoundingUp) {
                roundUp(integerDigits, fractionDigits);
            }
        }
    }

    var numberString = 
        integerDigits.join('') + 
        (fractionDigits.length ? '.' + fractionDigits.join('') : '');

    var sign = (result.sign ? '-' : '');
    return sign + numberString;
};

var getDouble2String2Digits = function(number, precision, options) {
    precision = (typeof(precision) === "undefined" ? 6 : precision);

    if (isNaN(number)) {
        return { notFinite: 'NaN' };
    }

    if (!isFinite(number)) {
        return {
            notFinite: (number > 0 ? 'Inf' : '-Inf')
        };
    }

    var bits = double2bits(number);
    
    // 2^52 1 and 51 zeros
    var ZERO = BigInt.zero();
    var ONE = BigInt.one();
    var TWO = BigInt.of(2);
    var TEN = BigInt.of(10);
    var TWO_EXP_52 = TWO.pow(BigInt.of(52));

    // number = r * 2^e
    var e = BigInt.of(bits.exponent === 0 ? -1074 : bits.exponent - 1075),
        r = BigInt
                .of(bits.mantissa)
                .add(bits.exponent === 0 ? ZERO : TWO_EXP_52),
        s;
 

    // number = r/s; r,s in Z
    if (e.isGreaterOrEqual(ZERO)) {
        s = ONE;
        r = r.mul(TWO.pow(e));
    }
    else {
        s = TWO.pow(e.negate());
    }

    var divMod = r.divMod(s);

    var integerDigits = divMod.div
        .toDecimalString()
        .split('')
        .map(Number);

    var fractionDigits = [];

    for (var i = 0; i < precision; i += 1) {
        divMod = divMod.mod.mul(TEN).divMod(s);
        fractionDigits.push(Number(divMod.div.toDecimalString()));
    }

    if (divMod.mod.mul(TEN).divMod(s).div.isGreaterOrEqual(BigInt.of(5))) {
        if (!options || !options.dontRound) {
            roundUp(integerDigits, fractionDigits);
        }
    }

    return {
        sign: bits.sign,
        integerDigits: integerDigits,
        fractionDigits: fractionDigits
    };
};

exports.double2string2 = function(number, precision) {
    var digits = getDouble2String2Digits(number, precision);

    if (digits.notFinite) {
        return digits.notFinite;
    }

    return (digits.sign ? '-' : '') + 
        digits.integerDigits.join('') + 
        (digits.fractionDigits.length ? '.' + digits.fractionDigits.join('') : '');
};

var log10 = function(n) {
    return Math.log(n) * Math.LOG10E;
};

var zeroArray = function(length) {
    var a = [];

    while (a.length < length) {
        a.push(0);
    }

    return a;
};

exports.double2string2exp = function(exponentString, number, precision) {
    var leadingDigits, fractionDigits, sign, exponent;
    var digits;

    var options = { dontRound: true };

    if (Math.abs(number) >= 1.0) {
        // case 1: (number >= 1)
        
        var numberOfIntegerDigits = Math.floor(log10(Math.abs(number)));
        
        // if we have integer digits we need less fraction digits.
        // one of integer digits will be before decimal dot
        // 2233.55 -> 2.23355 so we subtract 1, 
        var digitsAfterDotNeeded = Math.max(0, precision - (numberOfIntegerDigits - 1));

        // to avoid rounding errors etc. we add one to precision
        // (i cannot proof that previous compuation returns exact number of digits
        // after dot)
        digitsAfterDotNeeded += 1;

        digits = getDouble2String2Digits(number, digitsAfterDotNeeded, options);

        if (digits.notFinite) { return digits.notFinite; }

        exponent = digits.integerDigits.length - 1;
        
        leadingDigits = [digits.integerDigits[0]];
        fractionDigits = digits.integerDigits
            .slice(1)
            .concat(digits.fractionDigits);
        sign = digits.sign;
    }
    else if (number === 0.0) {
        sign = ((1/number) > 0 ? 0 : 1);
        leadingDigits = [0];
        fractionDigits = zeroArray(precision);
        exponent = 0;
    }
    else {
        // case 2: (number < 1)
        var numberOfZerosBeforeFirstDigit = Math.floor(-log10(Math.abs(number)));

        // +1 for number before dot e.g. 0.013344 -> 1.334400 (for precision 6 we need 7 digits),
        // another +1 for rounding errors
        var neededPrecision = numberOfZerosBeforeFirstDigit + 1 + precision + 1;

        digits = getDouble2String2Digits(number, neededPrecision, options);
        
        if (digits.notFinite) { return digits.notFinite; }

        sign = digits.sign;

        // because of rounding errors we may end up with number 1
        if (digits.integerDigits[0] === 1) {
            exponent = 0;
            leadingDigits = [1];
            fractionDigits = zeroArray(precision);
        }
        else {
            for (exponent = 0; exponent < digits.fractionDigits.length; exponent += 1) {
                if (digits.fractionDigits[exponent] !== 0) {
                    break;
                }
            }

            fractionDigits = digits.fractionDigits.slice(exponent);
            leadingDigits = [fractionDigits[0]];
            fractionDigits.shift();

            exponent = -exponent - 1;
        }
    }
    
    // when precision is limited we must round number
    // e.g. 1.66 -> 1.7e+00
    var needsRoundingUp =
        (fractionDigits.length >= precision && fractionDigits[precision] >= 5);

    fractionDigits = fractionDigits.slice(0, precision);
    if (needsRoundingUp) {
        roundUp(leadingDigits, fractionDigits);

        // fix situation 9.999 -> 10.00 (precision: 2)
        if (leadingDigits.length > 1) {
            exponent += 1;

            fractionDigits.unshift(leadingDigits[1]);
            fractionDigits.pop();

            leadingDigits = [leadingDigits[0]];
        }
    }

    var exponentDigits = String(Math.abs(exponent));

    return (sign ? '-' : '') +
        leadingDigits.join('') + '.' +
        fractionDigits.join('') +
        exponentString +
        (exponent < 0 ? '-' : '+') +
        (exponentDigits.length < 2 ? '0' + exponentDigits : exponentDigits);
};

