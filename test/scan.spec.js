(function() {
    'use strict';

    var chai = require('chai');

    chai.should();

    var scan = require('../src/scan.js').scan;

    describe('scan()', function() {
        describe('%s specifier', function() {
            it('reads sequence of non-whitespace characters', function() {

                scan('foo bar nyu', '%s')
                    .should.eql(['foo']);

                scan('foo\nbar\nnyu', '%s')
                    .should.eql(['foo']);

                scan('foozble', '%s')
                    .should.eql(['foozble']);

                scan(' nya', '%s')
                    .should.eql(['']);

                scan('nyan boro', '%s %s')
                    .should.eql(['nyan', 'boro']);

                scan('a b c d', '%s %s %s')
                    .should.eql(['a', 'b', 'c']);
            });

            it('supports field width', function() {
                scan('nyanyanya', '%3s %4s')
                    .should.eql(['nya', 'nyan']);

                scan('foobar', '%1s%1s%s')
                    .should.eql(['f', 'o', 'obar']);

                scan('f oobar', '%2s %3s')
                    .should.eql(['f', 'oob']);

                // behaviour exposed by C ssanf
                scan('foo bar', '%0s %s')
                    .should.eql(['foo', 'bar']);
            });

            it('allows to omit parsed value from results', function() {
                scan('foo bar nyu', '%s %*s %s')
                    .should.eql(['foo', 'nyu']);

                (scan('foo bar nyu', '%*s %*s %*s') === null)
                    .should.equal(true);
            });

            it('supports named arguments', function() {
                scan('foo x bar', '%{name}s x %{nick}s')
                    .should.eql({ name:'foo', nick:'bar' });

                scan('bob alice joe', '%{nameA}s %*s %{nameB}s')
                    .should.eql({ nameA:'bob', nameB:'joe' });

                scan('foo', '%{user.id}s')
                    .should.eql({
                        user: {
                            id: 'foo'
                        }
                    });

                scan('foo bar', '%{user.id}s %{user.token}s')
                    .should.eql({
                        user: {
                            id: 'foo',
                            token: 'bar'
                        }
                    });
            });
        });

        it('returns null for arguments that cannot be match', function() {
            scan('a b', '%s %s %s %s')
                .should.eql(['a', 'b', null, null]);

            scan('', '%s %s')
                .should.eql([null, null]);

            scan('foo bar', '%s x %s')
                .should.eql(['foo', null]);
        });
    });

}());
