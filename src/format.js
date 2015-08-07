/*jshint bitwise:false, browserify:true */

'use strict';

var _double2string = require('./double2string').double2string2;

var throwError = function(message) {
    throw new Error('format.js: ' + message);
};

var repeat = function(s, times) {
    return new Array(times + 1).join(s);
};

var padLeft = function(s, width, padChar) {
    padChar = padChar || ' ';

    if (s.length >= width) {
        return s;
    }
    else {
        var padding = repeat(padChar, width - s.length);
        return padding + s;
    }
};

var padRight = function(s, width) {
    if (s.length >= width) {
        return s;
    }
    else {
        var padding = repeat(' ', width - s.length);
        return s + padding;
    }
};

var hasFlag = function(flags, flag) {
    return flags && (flags.indexOf(flag) !== (-1));
};

var hasAnyFlag = function(flags) {
    var flagsToCheck = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < flagsToCheck.length; i += 1) {
        if (hasFlag(flags, flagsToCheck[i])) {
            return true;
        }
    }

    return false;
};

var nextArg = function(args, fullSpecifier) {
    if (!args.length) {
        throwError('specifier: ' + fullSpecifier + 
                   ' has no coresponding argument.');
    }

    return args.shift();
};

var numberOfCharsPrecision = function(formatted, precision) {
    if (precision !== null) {
        return formatted.substring(0, Number(precision));
    }
    else {
        return formatted;
    }
};

var integerPrecision = function(formatted, precision) {
    if (precision === null) {
        return formatted;
    }

    var sign = (formatted[0] === '-' ? '-' : '');
    formatted = formatted.substring(sign.length);

    if (precision === 0) {
        formatted = (formatted === '0' ? '' : formatted);
    }
    else {
        formatted = padLeft(formatted, precision, '0');
    }

    return sign + formatted;
};

var numberDecorator = function(options, number, width, formatted, flags) {
    var isLowercaseHex = hasFlag(options, 'x');
    var isUppercaseHex = hasFlag(options, 'X');
    var isHexNumber = isLowercaseHex || isUppercaseHex;
    var isOctNumber = hasFlag(options, 'o');
    var isUnsigned = hasAnyFlag(options, 'x', 'X', 'u', 'o');
    var isFloatingPoint = hasAnyFlag(options, 'f', 'F');

    if (hasFlag(flags, '+') && !isUnsigned) {
        if (isFloatingPoint) {
            if (number > 0 || isPlusZero(number)) {
                formatted = '+' + formatted;
            }
        }
        else if (number >= 0) {
            formatted = '+' + formatted;
        }
    }

    if (width && hasFlag(flags, '0')) {
        var sign = (/^[+ -]/.test(formatted) ? formatted[0] : '');
        formatted = formatted.substring(sign.length);

        formatted = padLeft(formatted, width - sign.length, '0');
        formatted = sign + formatted;
    }

    if (hasFlag(flags, ' ') && !isUnsigned) {
        if (formatted[0] !== '+' && formatted[0] !== '-') {
            formatted = ' ' + formatted;
        }
    }

    if (hasFlag(flags, '#')) {
        if (isHexNumber) {
            if (isLowercaseHex) {
                formatted = '0x' + formatted;
            }
            else {
                formatted = '0X' + formatted;
            }
        }
        else if (isOctNumber) {
            formatted = '0' + formatted;
        }
    }

    return formatted;
};

var isWildcard = function(value) {
    return (value === '*');
};

var toPositiveInteger = function(value) {
    value = Number(value);

    value = (!isFinite(value) ? 0 : value);
    value = (value | 0);

    return (value < 0 ? 0 : value);
};

var toInteger = function(value) {
    value = Number(value);
    value = (isFinite(value) ? (value | 0) : value);
    return value;
};

var toUnsignedInteger = function(value) {
    value = toInteger(value);
    value = (value >>> 0);
    return value;
};

var integerToString = function(number, radix, formatCase) {
    radix = radix || 10;

    if (!isFinite(number)) {
        return number.toString();
    }
    
    number = number.toString(radix);

    if (formatCase === 'uppercase') {
        return number.toUpperCase();
    }
    else if (formatCase === 'lowercase') {
        return number.toLowerCase();
    }
    else {
        return number;
    }
};

var nonNumberToString = function(number) {
    if (number === Number.NaN) {
        return 'NaN';
    }
    else if (number === Number.POSITIVE_INFINITY) {
        return 'Infinity';
    }
    else if (number === Number.NEGATIVE_INFINITY) {
        return '-Infinity';
    }
    else {
        return number.toString();
    }
};

var isMinusZero = function(n) {
    if (n !== 0) {
        return false;
    }

    return ((1/n) === Number.NEGATIVE_INFINITY);
};

var isPlusZero = function(n) {
    if (n !== 0) {
        return false;
    }

    return ((1/n) === Number.POSITIVE_INFINITY);
};

// produce number string without using E notation
var numberToString = (function() {
    var SCIENTIFIC_NOTATION_REGEX = /[Ee]/;
    var DEFAULT_PRECISION = 6;
    var MAX_TO_FIXED_PRECISION = 20;

    return function(number, precision) {
        precision = (precision === null ? DEFAULT_PRECISION : precision);

        if (!isFinite(number)) {
            return nonNumberToString(number);
        }

        // returns number in form 4.436 or 1.32e+4
        var numberString = null;
        
        if (precision <= MAX_TO_FIXED_PRECISION) {
            numberString = number.toFixed(precision);
        }
        
        // quick fix for -0 which is not handled properly by toFixed
        if (number === 0 && isMinusZero(number)) {
            numberString = '-' + numberString;
        }


        if (!numberString || SCIENTIFIC_NOTATION_REGEX.test(numberString)) {
            // use slow but accurate method to get number string
            numberString = _double2string(number, precision);
        }

        return numberString;
    };
}());

var formatSpecifier = function(next, flags, width, precision, spec) {
    var arg, 
        result,
        precisionFunc,
        decoratorFunc;

    if (isWildcard(width)) {
        width = toPositiveInteger(next());
    }

    if (isWildcard(precision)) {
        precision = toPositiveInteger(next());
    }

    switch(spec) {
    case 's':
        result = String(next());
        precisionFunc = numberOfCharsPrecision;
        break;
    
    case 'v':
        arg = next();

        if (arg && typeof(arg.valueOf) === "function") {
            result = String(arg.valueOf());
        }
        else {
            result = String(arg);
        }
        precisionFunc = numberOfCharsPrecision;
        break;

    case 'j':
        result = JSON.stringify(next());
        precisionFunc = numberOfCharsPrecision;
        break;

    case 'i': case 'd': case 'u':
        arg = (spec === 'u' ? toUnsignedInteger : toInteger)(next());
        result = integerToString(arg);

        precisionFunc = integerPrecision;
        decoratorFunc = numberDecorator.bind(null, spec, arg, width);
        break;

    case 'x': case 'X': case 'o':
        var radix = (spec === 'o' ? 8 : 16);
        arg = toUnsignedInteger(next());
        result = integerToString(arg, radix, (spec === 'x' ? 'lowercase' : 'uppercase'));

        precisionFunc = integerPrecision;
        decoratorFunc = numberDecorator.bind(null, spec, arg, width);
        break;

    case 'f': case 'F':
        arg = next();
        result = numberToString(arg, precision);
        decoratorFunc = numberDecorator.bind(null, spec, arg, width);
        break;

    case '%':
        return '%';

    default:
        // unknown specifier
        return undefined;
    }

    if (precisionFunc) {
        result = precisionFunc(result, precision);
    }

    if (decoratorFunc) {
        result = decoratorFunc(result, flags);
    }

    if (width) {
        var padFunction = (hasFlag(flags, '-') ? padRight : padLeft);
        result = padFunction(result, width);
    }

    return result;
};

var toWildcardOrNumber = function(value) {
    if (!value) {
        return null;
    }

    if (value.indexOf('*') !== (-1)) {
        return '*';
    }

    return Number(value);
};

exports.format = function(format) {
    if (typeof(format) !== "string") {
        throwError('first argument must be a string.');
    }

    var args = Array.prototype.slice.call(arguments, 1);

    // create new regex each time to avoid problems with lastIndex property
    
    // format: %[flags][width][.precision][length]specifier
    // based on: http://www.cplusplus.com/reference/cstdio/printf
    var SPECIFIER_REGEX = /%([-+ 0#]*)?(\d+|\*)?(?:(\.)(\d+|\*)?)?([a-zA-Z%])/g;

    return format.replace(SPECIFIER_REGEX, 
        function(fullSpec, flags, width, dot, precision, spec) {
            width = toWildcardOrNumber(width);

            if (dot && !precision) {
                precision = 0;
            }
            else {
                precision = toWildcardOrNumber(precision);
            }

            var next = nextArg.bind(null, args, fullSpec);
            var result = formatSpecifier(next, flags, width, precision, spec);

            return (result === undefined ? fullSpec : result);
        });
};
