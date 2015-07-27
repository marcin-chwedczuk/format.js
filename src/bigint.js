/*jshint bitwise:false */

(function(exports) {
    'use strict';

    // TODO: Merge with format.js or pin function to format.js
    
    var normalize = function(digits) {
        var lastSignificantDigit = digits.length - 1;

        while (lastSignificantDigit >= 0 && (digits[lastSignificantDigit] === 0)) {
            lastSignificantDigit -= 1;
        }

        if (lastSignificantDigit === digits.length) {
            return digits;
        }
        else if (lastSignificantDigit === (-1)) {
            return [0];
        }
        else {
            return digits.splice(0, lastSignificantDigit+1);
        }
    };

    var BigInt = exports.BigInt = function BigInt(sign, digits) {
        this._digits = normalize(digits);
        this._sign = (this.isZero() ? 1 : sign);
    };

    BigInt.prototype.toString = function() {
        var digits = this._digits.slice();
        digits.reverse();

        return this._getSignString() + '[' + digits + ']';
    };

    BigInt.prototype.sign = function() {
        return this._sign;
    };

    BigInt.prototype.changeSign = function(newSign) {
        if (newSign !== 1 && newSign !== (-1)) {
            throw new Error('invalid sign: ' + newSign);
        }

        if (newSign === this.sign()) {
            return this;
        }

        return new BigInt(newSign, this._digits);
    };

    BigInt.prototype.negate = function() {
        return this.changeSign(-this.sign());
    };

    var isSignCharacter = function(character) {
        return (character === '+' || character === '-');
    };

    var toSign = function(signCharacter) {
        if (signCharacter === '-') {
            return -1;
        }
        else {
            return 1;
        }
    };

    // Accepts strings in format: '00110' or '-01101'
    //
    BigInt.fromBinary = function(binaryString) {
        if (!binaryString || !/^[+-]?[01]+$/.test(binaryString)) {
            throw new Error('invalid argument: ' + binaryString);
        }

        var sign = 1, digits;

        if (isSignCharacter(binaryString[0])) {
            sign = toSign(binaryString[0]);
            binaryString = binaryString.substring(1);
        }

        digits = binaryString.split('').map(function(digit) {
            return Number(digit);
        });

        // lest significant bit has index 0
        digits.reverse();

        return new BigInt(sign, digits);
    };

    BigInt.zero = function() {
        return new BigInt(1, [0]);
    };

    BigInt.one = function() {
        return new BigInt(1, [1]);
    };

    BigInt.prototype.isPositive = function() {
        return (this.sign() === 1) && !this.isZero();
    };

    BigInt.prototype.isNegative = function() {
        return (this.sign() === -1) && !this.isZero();
    };

    BigInt.prototype.isZero = function() {
        return (this._digits.length === 1) && 
            (this._digits[0] === 0);
    };

    BigInt.prototype._getSignString = function() {
        var signString = (this.isNegative() ? '-' : '');
        return signString;
    };

    BigInt.prototype.toBinaryString = function() {
        var digits = this._digits.slice();
        digits.reverse();

        var binaryNumber = 
            this._getSignString() + digits.join('');

        return binaryNumber;
    };

    var addPositive = function(lDigits, rDigits) {
        var sum = [];

        var minLen = Math.min(lDigits.length, rDigits.length),
            carry = 0,
            i;

        for (i = 0; i < minLen; i++) {
            sum[i] = lDigits[i] + rDigits[i] + carry;

            if (sum[i] >= 2) {
                carry = 1;
                sum[i] -= 2;
            }
            else {
                carry = 0;
            }
        }

        var rest = (lDigits.length === minLen ? rDigits : lDigits);
        for (; i < rest.length; i += 1) {
            sum[i] = rest[i] + carry;

            if (sum[i] >= 2) {
                carry = 1;
                sum[i] -= 2;
            }
            else {
                carry = 0;
            }
        }

        if (carry) {
            sum[i] = carry;
        }

        return sum;
    };

    // lDigits must represent number that is greater than
    // number representated by rDigits.
    //
    var subtractPositive = function(lDigits, rDigits) {
        var difference = [];

        // assert: lDigits.length >= rDigits.length
        
        var carry = 0, i;

        for (i = 0; i < rDigits.length; i += 1) {
            difference[i] = lDigits[i] - rDigits[i] + carry;

            if (difference[i] < 0) {
                difference[i] += 2;
                carry = -1;
            }
            else {
                carry = 0;
            }
        }

        for (; i < lDigits.length; i += 1) {
            difference[i] = lDigits[i] + carry;

            if (difference[i] < 0) {
                difference[i] += 2;
                carry = -1;
            }
            else {
                carry = 0;
            }
        }

        if (carry !== 0) {
            throw new Error('never goes here');
        }

        return difference;
    };


    BigInt.prototype.add = function(other) {
        if (!other) {
            throw new Error('missing argument');
        }

        if (this.sign() !== other.sign()) {
            var bigger = this;
            var smaller = other;

            var cmp = comparePositive(bigger._digits, other._digits);
            if (cmp === 0) {
                return BigInt.zero();
            }
            else if (cmp < 0) {
                var tmp = bigger; bigger = smaller; smaller = tmp;
            }

            var difference = subtractPositive(bigger._digits, smaller._digits);
            return new BigInt(bigger.sign(), difference);
        }
        else {
            var sum = addPositive(this._digits, other._digits);
            return new BigInt(this.sign(), sum);
        }
    };

    var mulPositive = function(lDigits, rDigits) {
        var result = [0];
        var partial = lDigits.slice(); // do not modify lDigits by unshift

        for (var i = 0; i < rDigits.length; i += 1) {
            if (rDigits[i]) {
                result = addPositive(result, partial);
            }

            // partial = addPositive(partial, partial);
            // partial + partial = 2*partial = .unshift(0)
            partial.unshift(0);
        }

        return result;
    };

    BigInt.prototype.mul = function(other) {
        if (!other) {
            throw new Error('missing argument');
        }

        if (this.isZero() || other.isZero()) {
            return BigInt.zero();
        }

        var sign = this.sign() * other.sign();
        var product = mulPositive(this._digits, other._digits);

        return new BigInt(sign, product);
    };

    // divides two positive NORMALIZED numbers
    // returns divident/divisor = [quotient, rest]
    var dividePositive = function(divident, divisor) {
        var quotient = [],
            shift = 0;
        
        // do not modify original number
        divisor = divisor.slice(); 
        divident = divident.slice();

        while (divisor.length < divident.length) {
            divisor.unshift(0);
            shift += 1;
        }

        for (; shift >= 0; shift -= 1) {
            if (comparePositive(divident, divisor) >= 0) {
                divident = subtractPositive(divident, divisor);
                divident = normalize(divident);

                quotient.unshift(1);
            }
            else {
                quotient.unshift(0);
            }

            divisor.shift();
        }

        return [quotient, divident];
    };

    BigInt.prototype.div = function(other) {
        if (!other) {
            throw new Error('missing argument');
        }

        if (other.isZero()) {
            throw new Error('attempt to divide by zero.');
        }

        if (this.isZero()) {
            return BigInt.zero();
        }

        var sign = this.sign() * other.sign();
        var qr = dividePositive(this._digits, other._digits);

        return new BigInt(sign, qr[0]);
    };

    BigInt.prototype.mod = function(other) {
         if (!other) {
            throw new Error('missing argument');
        }

        if (other.isZero()) {
            throw new Error('attempt to divide by zero.');
        }

        var qr = dividePositive(this._digits, other._digits);

        return new BigInt(this.sign(), qr[1]);
    };

    // Accepts strings in format: 99328 or -399 or +32
    //
    BigInt.fromDecimal = (function() {
        var DECIMAL_DIGIT_TO_BIGINT = 
            ['0', '1', '10', '11', '100', '101', '110', '111',
             '1000', '1001', '1010']
            .map(function(bin) {
                return BigInt.fromBinary(bin);
            });

        return function(decimalString) {
            if (!decimalString || !/^[+-]?[0-9]+$/.test(decimalString)) {
                throw new Error('invalid argument: ' + decimalString);
            }

            var sign = 1;

            if (isSignCharacter(decimalString[0])) {
                sign = toSign(decimalString[0]);
                decimalString = decimalString.substring(1);
            }

            var digits = decimalString.split('').map(function(d) {
                return DECIMAL_DIGIT_TO_BIGINT[Number(d)];
            });

            var result = digits.reduce(function(acc, curr) {
                return acc.mul(DECIMAL_DIGIT_TO_BIGINT[10]).add(curr);
            }, BigInt.zero());

            return result.changeSign(sign);
        };
    }());

    BigInt.of = function(n) {
        var tmp = (Number(n) | 0);
        
        if (!isFinite(tmp)) {
            throw new Error('invalid argument: ' + n);
        }

        return BigInt.fromDecimal(tmp.toString());
    };

    BigInt.prototype.toDecimalString = (function() {
        var BINARY_TO_DECIMAL = {
            '0':    '0',
            '1':    '1',
            '10':   '2',
            '11':   '3',
            '100':  '4',
            '101':  '5',
            '110':  '6',
            '111':  '7',
            '1000': '8',
            '1001': '9'
        };
        
        var TEN = BigInt.of(10);

        return function() {
            var digits = [];

            var num = (this.isNegative() ? this.negate() : this);
            
            while (num.isGreaterThan(BigInt.zero())) {
                var digit = num.mod(TEN);
                num = num.div(TEN);

                digits.unshift(BINARY_TO_DECIMAL[digit.toBinaryString()]);
            }

            return (this.isNegative() ? '-' : '') + (digits.join('') || '0');
        };
    }());

    BigInt.prototype.isEqual = function(other) {
        if (!other || !(other instanceof BigInt)) {
            return false;
        }

        if (this.sign() !== other.sign()) {
            return false;
        }

        var cmp = comparePositive(this._digits, other._digits);
        return (cmp === 0);
    };

    BigInt.prototype.isLowerThan = function(other) {
        if (this.sign() < other.sign()) {
            return true;
        }
        else if (this.sign() > other.sign()) {
            return false;
        }
        else {
            var cmp = comparePositive(this._digits, other._digits);
            return (this.isNegative() ? (cmp > 0) : (cmp < 0));
        }
    };

    BigInt.prototype.isLowerOrEqual = function(other) {
        return this.isLowerThan(other) || this.isEqual(other);
    };

    BigInt.prototype.isGreaterThan = function(other) {
        return other.isLowerThan(this);
    };

    BigInt.prototype.isGreaterOrEqual = function(other) {
        return other.isLowerOrEqual(this);
    };

    // compares numbers represented by two NORMALIZED
    // digits arrays
    var comparePositive = function(normalizedLeft, normalizedRight) {
        if (normalizedLeft.length !== normalizedRight.length) {
            return normalizedLeft.length - normalizedRight.length;
        }

        for (var i = normalizedLeft.length - 1; i >= 0; i -= 1) {
            if (normalizedLeft[i] !== normalizedRight[i]) {
                return normalizedLeft[i] - normalizedRight[i];
            }
        }

        return 0;
    };

    BigInt.prototype.bitAt = function(index) {
        if (typeof(index) !== 'number') {
            throw new Error('argument must be a number: ' + index);
        }

        if (index < 0 || index >= this._digits.length) {
            return 0;
        }

        return this._digits[index];
    };


}(this));
