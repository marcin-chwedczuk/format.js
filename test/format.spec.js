(function() {
    'use strict';

    var chai = require('chai');
    var expect = chai.expect;
    chai.should();

    var format = require('../src/format.js').format;

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

        describe('%s specifier', function() {
            it('replaces specifier with String()\'ed version of argument', function() {
                format('[%s]', 'foo').should.equal('[foo]');
                format('[%s]', null).should.equal('[null]');
                format('[%s]', undefined).should.equal('[undefined]');
                format('[%s]', {}).should.equal('[[object Object]]');
                format('[%s]', { toString: function() { return 'ok'; } })
                    .should.equal('[ok]');
            });
        });

        describe('%v specifier', function() {
            it('replaces specifier with String()\'ed version of value ' + 
               'returned by valueOf() method', function() {
                
                // Object(33) creates Number wrapper around 33
                format('[%v]', Object(33))
                    .should.equal('[33]');
            });

            it('behaves as %s when argument has no valueOf() method', function() {
                var obj = { valueOf: null, toString: function() { return 'foo'; } };

                format('[%v]', obj)
                    .should.equal('[foo]');
            });

            it('behaves as %s when argument is null or undefined', function() {
                format('[%v]', null)
                    .should.equal('[null]');
            });
        });

    });

}());
