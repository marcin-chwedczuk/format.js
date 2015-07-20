/*jshint bitwise:false */

(function(exports) {
    'use strict';

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

    var nextArg = function(args, fullSpecifier) {
        if (!args.length) {
            throwError('specifier: ' + fullSpecifier + 
                       ' has no coresponding argument.');
        }

        return args.shift();
    };

    var numberOfCharsPrecision = function(formatted, precision) {
        if (precision) {
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

    var integerDecorator = function(number, width, formatted, flags) {
        if (hasFlag(flags, '+')) {
            if (number >= 0) {
                formatted = '+' + formatted;
            }
        }

        if (width && hasFlag(flags, '0')) {
            var sign = (/^[+ -]/.test(formatted) ? formatted[0] : '');
            formatted = formatted.substring(sign.length);

            formatted = padLeft(formatted, width - sign.length, '0');
            formatted = sign + formatted;
        }

        if (hasFlag(flags, ' ')) {
            if (formatted[0] !== '+' && formatted[0] !== '-') {
                formatted = ' ' + formatted;
            }
        }

        return formatted;
    };

    var formatSpecifier = function(next, flags, width, precision, spec) {
        var arg, 
            result,
            precisionFunc,
            decoratorFunc;

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

        case 'i': case 'd':
            arg = Number(next());
            arg = (isFinite(arg) ? (arg | 0) : arg);
            result = String(arg);

            precisionFunc = integerPrecision;
            decoratorFunc = integerDecorator.bind(null, arg, width);
            break;

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


    exports.format = function(format) {
        if (typeof(format) !== "string") {
            throwError('first argument must be a string.');
        }

        var args = Array.prototype.slice.call(arguments, 1);

        // create new regex each time to avoid problems with lastIndex property
        
        // format: %[flags][width][.precision][length]specifier
        // based on: http://www.cplusplus.com/reference/cstdio/printf
        var SPECIFIER_REGEX = /%([-+ 0]*)?(\d+|\*)?(?:\.(\d+))?([a-zA-Z])/g;

        return format.replace(SPECIFIER_REGEX, function(fullSpec, flags, width, precision, spec) {
            width = (width ? Number(width) : null);
            precision = (precision ? Number(precision) : null);

            var next = nextArg.bind(null, args, fullSpec);
            var result = formatSpecifier(next, flags, width, precision, spec);

            return (result === undefined ? fullSpec : result);
        });
    };

}(this));
