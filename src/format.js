
(function(exports) {
    'use strict';

    var throwError = function(message) {
        throw new Error('format.js: ' + message);
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

    var unused = function() { };

    var MissingSpecifierArgument = function() { };

    var Formatter = function() {
        var self = this;

        self.isApplicable = function(specifier) {
            unused(specifier);
            throw new Error('should be implemented in subclass');
        };

        self.format = function(flags, width, precision, args, fullSpec) {
            unused(flags, width, precision, args, fullSpec);
            throw new Error('should be implemented in subclass');
        };

        self.assertHasArg = function(args) {
            if (args.length < 1) {
                throw new MissingSpecifierArgument();
            }
        };
    };

    var StringBasedSpecifierFormatter = function() {
        var self = this;

        Formatter.call(this);

        self.getValue = function(args) {
            self.assertHasArg(args);
            return args.shift();
        };

        self.format = function(flags, width, precision, args) {
            var result = String(self.getValue(args));

            if (precision) {
                result = result.substring(0, Number(precision));
            }

            if (width) {
                var padFunction = (hasFlag(flags, '-') ? padRight : padLeft);
                result = padFunction(result, Number(width));
            }

            return result;
        };
    };

    var StringSpecifierFormatter = function() {
        var self = this;

        StringBasedSpecifierFormatter.call(self);

        self.isApplicable = function(spec) {
            return (spec === 's');
        };
    };

    var ValueOfSpecifierFormatter = function() {
        var self = this;

        StringBasedSpecifierFormatter.call(self);

        self.isApplicable = function(spec) {
            return (spec === 'v');
        };

        self.getValue = function(args) {
            var arg = args.shift();

            if (arg && typeof(arg.valueOf) === "function") {
                return arg.valueOf();
            }
            else {
                return arg;
            }
        };
    };

    var JsonSpecifierFormatter = function() {
        var self = this;

        StringBasedSpecifierFormatter.call(self);

        self.isApplicable = function(spec) {
            return (spec === 'j');
        };

        self.getValue = function(args) {
            return JSON.stringify(args.shift());
        };
    };

    var IntegerSpecifierFormatter = function() {
        var self = this;

        StringBasedSpecifierFormatter.call(self);

        self.isApplicable = function(spec) {
            return (spec === 'd' || spec === 'i');
        };
        
        self.getValue = function(args) {
            var num = Number(args.shift());
            return (isFinite(num) ? Math.round(num) : num);
        };
    };

    var UnknownSpecifierFormatter = function() {
        var self = this;

        self.isApplicable = function() {
            return true;
        };

        self.format = function(flags, width, precision, args, fullSpec) {
            return fullSpec;
        };
    };

    var FORMATTERS = [
        new StringSpecifierFormatter(),
        new ValueOfSpecifierFormatter(),
        new JsonSpecifierFormatter(),
        new IntegerSpecifierFormatter(),
        new UnknownSpecifierFormatter()
    ];

    var getFormatter = function(spec) {
        for (var i = 0; i < FORMATTERS.length; i += 1) {
           var formatter = FORMATTERS[i];

           if (formatter.isApplicable(spec)) {
                return formatter;
           }
        }

        throw new Error('never comes here');
    };

    exports.format = function(format) {
        if (typeof(format) !== "string") {
            throwError('first argument must be a string.');
        }

        var args = Array.prototype.slice.call(arguments, 1);

        // format: %[flags][width][.precision][length]specifier
        // based on: http://www.cplusplus.com/reference/cstdio/printf
        return format.replace(/%([-])?(\d+|\*)?(?:\.(\d+))?([a-zA-Z])/g, 
        function(match, flags, width, precision, spec) {
            var formatter = getFormatter(spec);

            try {
                return formatter.format(flags, width, precision, args, match);
            }
            catch(e) {
                if (e instanceof MissingSpecifierArgument) {
                     throwError('specifier: ' + match + 
                                ' has no coresponding argument.');
                }

                throw e;
            }
        });
    };

}(this));
