
(function(exports) {
    'use strict';

    var throwError = function(message) {
        throw new Error('format.js: ' + message);
    };

    exports.format = function(format) {
        if (typeof(format) !== "string") {
            throwError('first argument must be a string.');
        }

        var args = Array.prototype.slice.call(arguments, 1);

        var assertHasArg = function(fullSpecifier) {
            if (!args.length) {
                throwError('specifier: ' + fullSpecifier + 
                           ' has no coresponding argument.');
            }
        };

        var repeat = function(s, times) {
            return new Array(times + 1).join(s);
        };
        
        var padLeft = function(s, width) {
            if (s.length >= width) {
                return s;
            }
            else {
                var padding = repeat(' ', width - s.length);
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

        /*
        var StringBasedSpecifier = function(spec) {
            var self = this;

            self.format = function(flags, width, precision, args) {
            
            };
        };*/

        var formatSpecifier = function(fullSpec, flags, width, precision, spec) {
            var arg, result;

            assertHasArg(fullSpec);

            switch(spec) {
            case 's':
                result = String(args.shift());
                break;
            
            case 'v':
                arg = args.shift();

                if (arg && typeof(arg.valueOf) === "function") {
                    result = String(arg.valueOf());
                }
                else {
                    result = String(arg);
                }
                break;

            case 'j':
                result = JSON.stringify(args.shift());
                break;

            case 'i': case 'd':
                result = String(Number(args.shift()));
                break;

            default:
                // unknown specifier
                return fullSpec;
            }

            if (precision) {
                result = result.substring(0, Number(precision));
            }

            if (width) {
                var padFunction = (hasFlag(flags, '-') ? padRight : padLeft);
                result = padFunction(result, Number(width));
            }

            return result;
        };

        // format: %[flags][width][.precision][length]specifier
        // based on: http://www.cplusplus.com/reference/cstdio/printf
        return format.replace(/%([-])?(\d+|\*)?(?:\.(\d+))?([a-zA-Z])/g, 
        function(match, flags, width, precision, spec) {
            var KNOWN_SPECIFIERS = 'svjdi';

            if (KNOWN_SPECIFIERS.indexOf(spec) === (-1)) {
                return match;
            }
            else {
                return formatSpecifier(match, flags, width, precision, spec);
            }
        });
    };

}(this));
