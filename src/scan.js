/*jshint browserify:true */
'use strict';

var isSpace = function(c) {
    c = c.charCodeAt(0);
    return ((c>=0x09 && c<=0x0D) || (c===0x20));
};

var InputIterator = function(input) {
    this.input = input;

    this.position = 0;
    this.length = input.length;
};

InputIterator.prototype._ended = function() {
    return (this.position >= this.length);
};

InputIterator.prototype._current = function() {
    if (this._ended()) {
        return '';
    }

    return this.input[this.position];
};

InputIterator.prototype._next = function() {
    this.position += 1;
};

InputIterator.prototype._setMismatch = function() {
    // don't parse rest of input on character mismatch
    this.position = this.length;
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

InputIterator.prototype.matchRegex = function(regex, maxWidth) {
    if (this._ended()) {
        return null;
    }

    var m = regex.exec(this.input.substring(this.position));
    var matchText;

    if (m === null) {
        this._setMismatch();
        return null;
    }
    else {
        matchText = m[0];

        if (maxWidth !== null) {
            maxWidth = Math.min(maxWidth, matchText.length);
            matchText = matchText.substring(0, maxWidth);
        } 

        this.position += matchText.length;
        return matchText;
    }
};

InputIterator.prototype.toString = function() {
    if (this._ended()) {
        return '<<EOF>>';
    }
    else {
        return this.input.substring(this.index);
    }
};

var addResult = function(result, name, value) {
    if (name !== undefined) {
        result.named = (result.named || {});

        var propertyNames = name.split('.');
        var obj = result.named;

        // for path property names like foo.bar.nyu
        // traverse result object tree and create objects when
        // necessary
        for (var i = 0; i < propertyNames.length - 1; i += 1) {
            obj = obj[propertyNames[i]] = (obj[propertyNames[i]] || {});
        }
        obj[propertyNames[propertyNames.length-1]] = value;
    }
    else {
        result.positional = (result.positional || []);
        result.positional.push(value);
    }
};

var parseArg = function(spec, width, name, input, result) {
    var skip, value;

    skip = (width === '*');
    
    width = ( (!width || (width === '*')) ? null : Number(width) );
    if (width === 0) {
        // sscanf behaviour
        width = null;
    }

    switch (spec) {
    case '%':
        input.matchExactly('%');
        break;

    case 's':
        value = input.matchRegex(/^\S*/, width);
        break;

    default:
        throw new Error('scan: unknown specifier: ' + spec);
    }

    if (!skip) {
        addResult(result, name, value, skip);
    }
};

exports.scan = (function() {
    // %{name}10s or %d or %*d
    var ARG_REGEX = /%(?:\{([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\})?(\*|\d+)?([a-z%])/g;

    return function(input, format) {
        if (typeof(input) !== 'string') {
            throw new TypeError('scan: argument "input" must be a string');
        }

        if (typeof(format) !== 'string') {
            throw new TypeError('scan: argument "format" must be a string');
        }

        input = new InputIterator(input);

        var match, prevMatchEnd = 0;
        var result = {
            positional: null,
            named: null
        };

        var width, spec, name;

        ARG_REGEX.lastIndex = 0;
        while ((match = ARG_REGEX.exec(format)) !== null) {
            input.match(format.substring(prevMatchEnd, match.index));

            width = match[2];
            spec = match[3];
            name = match[1];
            parseArg(spec, width, name, input, result);

            prevMatchEnd = match.index + match[0].length;
        }

        return (result.positional ? result.positional : result.named);
    };

}());
