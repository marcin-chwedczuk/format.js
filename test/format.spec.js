(function() {
    'use strict';

    var chai = require('chai');
    var expect = chai.expect;
    chai.should();

    var format = require('../src/format.js').format;

    var constFn = function(constant) {
        return function() {
            return constant;
        };
    };

    describe('format()', function() {
        it('throws exception given non-string format', function() {
            expect(format.bind(null, 33)).to.throw();
            expect(format.bind(null, null)).to.throw();
            expect(format.bind(null, {})).to.throw();
        });

        it('returns format if format contains no specifiers', function() {
            var input = 'Long & complicated string with 3.1425 and ./;{}.\n';
            var result = format(input);

            result.should.equal(input);
        });

        it('doesn\'t replace unknown specifiers', function() {
            format('unknown: %Z specifier %#')
                .should.equal('unknown: %Z specifier %#');
        });

        it('throws exception when there is more specifiers than arguments', function() {
            format.bind(null, '%s %s %s', 'foo', 'bar')
                .should.throw();
        });

        it('ignores excessive arguments', function() {
            format.bind(null, '%s', 'foo', 'bar', 'nyu')
                .should.not.throw();
        });

        describe('%s specifier', function() {
            it('replaces specifier with String()\'ed version of argument', function() {
                format('[%s]', 'foo').should.equal('[foo]');
                format('[%s]', null).should.equal('[null]');
                format('[%s]', undefined).should.equal('[undefined]');
                format('[%s]', {}).should.equal('[[object Object]]');
                format('[%s]', { toString: constFn('ok') })
                    .should.equal('[ok]');
            });
        });

        describe('%v specifier (valueOf)', function() {
            it('replaces specifier with String()\'ed version of value ' + 
               'returned by valueOf() method of argument', function() {
                
                // Object(33) creates Number wrapper around 33
                format('[%v]', Object(33))
                    .should.equal('[33]');

                format('[%v]', { valueOf: constFn(3) })
                    .should.equal('[3]');
            });

            it('behaves as %s when argument has no valueOf() method', function() {
                var obj = { valueOf: null, toString: constFn('foo') };

                format('[%v]', obj)
                    .should.equal('[foo]');
            });

            it('behaves as %s when argument is null or undefined', function() {
                format('[%v]', null)
                    .should.equal('[null]');
            });

            it('works when valueOf() returns null or undefined', function() {
                format('[%v]', { valueOf: constFn(null) })
                    .should.equal('[null]');

                format('[%v]', { valueOf: constFn(undefined) })
                    .should.equal('[undefined]');
            });
        });

        describe('%j specifier (JSON)', function() {
            it('replaces specifier with JSON.stringify()\'ed ' + 
               'version of argument', function() {
                
                format('[%j]', { foo: 1 })
                    .should.equal('[{"foo":1}]');

                format('[%j]', true)
                    .should.equal('[true]');

                format('[%j]', 1)
                    .should.equal('[1]');

                // NaN's are not permitted in JSON, they are
                // serialized as null's
                format('[%j]', NaN)
                    .should.equal('[null]');
            });
        });

        describe('%i or %d specifier (integer)', function() {
            it('prints integer part of Number()\'ed argument', function() {
                format('[%d]', 33)
                    .should.equal('[33]');

                format('[%i]', 71)
                    .should.equal('[71]');

                format('[%d]', { valueOf: constFn(123) })
                    .should.equal('[123]');
            });

            it('ignores fraction part of number', function() {
                format('[%d]', 3.141592)
                    .should.equal('[3]');

                format('[%d]', 3.9)
                    .should.equal('[3]');

                format('[%d]', -3.21)
                    .should.equal('[-3]');

                format('[%d]', -3.7)
                    .should.equal('[-3]');
            });
        });

        describe('width specifier', function() {
            it('specifies minimum field width (too short fields are padded ' + 
               'with spaces on the right)', function() {
            
                format('%10s', 'foo')
                    .should.equal('       foo');

                format('%10s', 'x')
                    .should.equal('         x');

                format('%3s', 'foo')
                    .should.equal('foo');

                format('%5s', 'mymymy')
                    .should.equal('mymymy');
            });

            it('when minus flag is specified field are padded on the left', function() {
                format('%-10s', 'foo')
                    .should.equal('foo       ');

                format('%-10s', 'x')
                    .should.equal('x         ');

                format('%-3s', 'foo')
                    .should.equal('foo');

                format('%-5s', 'mymymy')
                    .should.equal('mymymy');
            });
        });

        describe('precision specifier', function() {
            it('given %s,%v,%j specifiers limits number of character printed', function() {
                format('[%.3s]', 'foo')
                    .should.equal('[foo]');

                format('[%.3s]', 'foozble')
                    .should.equal('[foo]');

                format('[%.3s]', 'fo')
                    .should.equal('[fo]');

                format('[%.5v]', { valueOf: constFn(123456) })
                    .should.equal('[12345]');

                format('[%.1j]', { foo: 1 })
                    .should.equal('[{]');
            });

            it('given %i and %d specifiers sets minimum number of digits in number ' + 
               '(if number is too short it should be padded with zeros)', function() {
                
                format('[%.3d]', 1)
                    .should.equal('[001]');

                format('[%.3d]', 123)
                    .should.equal('[123]');

                format('[%.3i]', 1024)
                    .should.equal('[1024]');

                format('[%.3d]', -3)
                    .should.equal('[-003]');

                format('[%.3d]', -1234)
                    .should.equal('[-1234]');
            });

            it('causes %i and %d specifiers to write nothing if precision is zero ' + 
               'and argument is zero', function() {
                
                format('[%.0d]', 0)
                    .should.equal('[]');

                format('[%.0d]', 11)
                    .should.equal('[11]');

                format('[%.0i]', 0)
                    .should.equal('[]');
            });
        });

        describe('flags', function() {
            it('plus flag causes positive numbers to be preceded by (+) sign', function() {
                format('[%+d]', 3)
                    .should.equal('[+3]');

                format('[%+d]', -3)
                    .should.equal('[-3]');

                format('[%+d]', 0)
                    .should.equal('[+0]');

                // TODO: Add floating points
            });

            it('space flag causes space to be added before number if number has no sign', function() {
                format('[% d]', 3)
                    .should.equal('[ 3]');

                format('[% d]', -3)
                    .should.equal('[-3]');

                format('[% d]', 0)
                    .should.equal('[ 0]');
            });

            it('zero flag causes zeros to be used as padding in numbers when width is specified', 
            function() {
                format('[%03d]', 1)
                    .should.equal('[001]');

                format('[%05d]', -31)
                    .should.equal('[-0031]');

                format('[%05d]', 0)
                    .should.equal('[00000]');
            });
        });

        describe('integration tests', function() {
            it('allows to use complex specifiers', function() {
                format('%5.3s', 'zzzkkkxxx')
                    .should.equal('  zzz');

                format("%+.0d", 0)
                    .should.equal('+');
            });

            it('allows to use many flags at once', function() {
                format('%-+10.3d', 2)
                    .should.equal('+002      ');

                format('%-+10.3i', -2)
                    .should.equal('-002      ');
            });
        });

    });

}());
