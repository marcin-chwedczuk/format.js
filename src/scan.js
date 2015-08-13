/*jshint browserify:true */
'use strict';

var isSpace = function(c) {
    c = c.charCodeAt(0);
    return ((c>=0x09 && c<=0x0D) || (c===0x20));
};

var InputIterator = function(input) {
    this.input = input;

    this.current = 0;
    this.length = input.length;
};

InputIterator.prototype._ended = function() {
    return (this.current >= this.length);
};

InputIterator.prototype._current = function() {
    if (this._ended()) {
        return '';
    }

    return this.input[this.current];
};

InputIterator.prototype._next = function() {
    this.current += 1;
};

InputIterator.prototype._setMismatch = function() {
    // don't parse rest of input on character mismatch
    this.current = this.length;
};

InputIterator.prototype.match = function(s) {
    for (var i = 0; i < s.length; i += 1) {
        this.matchCharacter(s.charAt(i));
    }
};

InputIterator.prototype.matchCharacter = function(c) {
    if (this._ended()) {
        return;
    }

    if (isSpace(c)) {
        this.matchSpace();
    }
    else {
        this.matchExactly(c);
    }
};

InputIterator.prototype.matchSpace = function() {
    while (!this._ended() && isSpace(this._current())) {
        this._next();
    }
};

InputIterator.prototype.matchExactly = function(c) {
    if (this._ended()) {
        return;
    }

    if (this._current() !== c) {
        this._setMismatch();
    }
    else {
        this._next();
    }
};

var parseArg = function(match, input, result) {
    throw new Error('not impl!');   
};

exports.scan = (function() {
    // %{name}10s or %d or %*d
    var ARG_REGEX = /^%(?:\{([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\})?(\*|\d+)?([a-z%])/g;

    return function(input, format) {
        if (typeof(input) !== 'string') {
            throw new TypeError('argument "input" must be a string');
        }

        if (typeof(format) !== 'string') {
            throw new TypeError('argument "format" must be a string');
        }

        input = new InputIterator(input);

        var match, prevMatchEnd = 0;
        var result = {
            positional: null,
            named: null
        };

        ARG_REGEX.lastIndex = 0;
        while ((match = ARG_REGEX.exec(format)) !== null) {
            input.match(format.substring(prevMatchEnd, match.index));
            parseArg(match, input, result);

            prevMatchEnd = match.index + match[0].length;
        }

        return (result.positional ? result.positional : result.named);
    };

}());
