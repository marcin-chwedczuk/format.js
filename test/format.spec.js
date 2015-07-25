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

        it('allows to write % using %% specifier', function() {
            format('%% foo %%')
                .should.equal('% foo %');
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

        describe('%u specifier', function() {
            it('prints unsigned 32bit integer', function() {
                format('[%u]', 123)
                    .should.equal('[123]');

                format('[%u]', -321)
                    .should.equal('[4294966975]');
            });

            it('doesn\'t support + flag', function() {
                format('[%+u]', 12)
                    .should.equal('[12]');
            });

            it('doesn\'t support (space) flag', function() {
                format('[% u]', 23)
                    .should.equal('[23]');
            });
        });

        describe('%x and %X specifiers', function() {
            it('%x prints 32bit number in lowercase hex', function() {
                format('[%x]', 3252)
                    .should.equal('[cb4]');

                format('[%x]', -3252)
                    .should.equal('[fffff34c]');
            });

            it('%X prints 32bit number in uppercase hex', function() {
                format('[%X]', 3252)
                    .should.equal('[CB4]');

                format('[%X]', -3252)
                    .should.equal('[FFFFF34C]');
            
            });

            it('can be used with width', function() {
                format('[%10x]', 372)
                    .should.equal('[       174]');

                format('[%05x]', 11)
                    .should.equal('[0000b]');

            });

            it('+ and (space) flags are not supported', function() {
                format('[%+x]', 33)
                    .should.equal('[21]');

                format('[% x]', 33)
                    .should.equal('[21]');
            });

            it('prefixes number with 0x or 0X when # flag is specified', function() {
                format('[%#x]', 33)
                    .should.equal('[0x21]');

                format('[%#X]', 33)
                    .should.equal('[0X21]');

                format('[%#03x]', 1)
                    .should.equal('[0x001]');

                format('[%#.3x]', 1)
                    .should.equal('[0x001]');
            });

            it('can be used with precision', function() {
                format('[%.3x]', 1)
                    .should.equal('[001]');
            });

        });

        describe('%o specifier', function() {
            it ('%o prints 32bit unsigned number in octal', function() {
                format('[%o]', 332)
                    .should.equal('[514]');

                format('[%o]', -332)
                    .should.equal('[37777777264]');

                format('[%o]', 17)
                    .should.equal('[21]');

                format('[%o]', 13)
                    .should.equal('[15]');
            });

            it('can be used with width', function() {
                format('[%10o]', 372)
                    .should.equal('[       564]');

                format('[%05o]', 11)
                    .should.equal('[00013]');

            });

            it('+ and (space) flags are not supported', function() {
                format('[%+o]', 33)
                    .should.equal('[41]');

                format('[% o]', 33)
                    .should.equal('[41]');
            });

            it('prefixes number with 0 when # flag is specified', function() {
                format('%#o', 33)
                    .should.equal('041');
            });

            it('can be used with precision', function() {
                format('[%.3o]', 1)
                    .should.equal('[001]');
            });
        });

        describe('%f and %F specifiers', function() {
            xit('print real numbers', function() {
                format('[%f]', 332.1223)
                   .should.equal('[332.1223]');

                // TODO: add .000000 - 6 digits default precision
                format('[%f]', 33232432423434324234243432432424.343242342)
                   .should.equal('[33232432654770135060433206247424]');

                format('[%f]', -32.321)
                    .should.equal('[-32.321]');

               format('[%f]', 32)
                    .should.equal('[32]');

               format('[%f]', 0.321)
                    .should.equal('[0.321]');
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

            it('allows to pass width as argument preceding specifier argument', function() {
                format('%*s', 3, 'foo')
                    .should.equal('foo');

                format('%*s', 1, 'foo')
                    .should.equal('foo');

                format('%*s', 5, 'foo')
                    .should.equal('  foo');
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

            it('allows to pass precision as argument preceding specifier argument', function() {
                format('[%.*s]', 3, 'foozble')
                    .should.equal('[foo]');

                format('[%.*s]', 7, 'foozble')
                    .should.equal('[foozble]');

                format('[%.*d]', 3, 3)
                    .should.equal('[003]');
            });

            it('assumes that precision is zero when no number is specified after dot', function() {
                format('[%.s]', 'foo')
                    .should.equal('[]');

                format('[%.d]', 0)
                    .should.equal('[]');

                format('[%.d]', 123)
                    .should.equal('[123]');
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

                format('%+.0d', 0)
                    .should.equal('+');

                format('[%+ d]', 0)
                    .should.equal('[+0]');
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
