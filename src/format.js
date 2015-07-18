
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
        
        return format.replace(/%([a-z])/g, function(match, spec) {
            var arg;

            switch(spec) {
            case 's':
                assertHasArg(match);
                return String(args.shift());
            
            case 'v':
                assertHasArg(match);
                arg = args.shift();

                if (arg && typeof(arg.valueOf) === "function") {
                    return String(arg.valueOf());
                }
                else {
                    return String(arg);
                }
                break;

            default:
                return match;
            }
        });
    };

}(this));
