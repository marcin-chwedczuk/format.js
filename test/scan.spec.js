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

        describe('%d specifier', function() {
            it('allows to read decimal number with optional sign', function() {
                scan('123', '%d')
                    .should.eql([123]);

                scan('+44', '%d')
                    .should.eql([44]);

                scan('0', '%d')
                    .should.eql([0]);

                scan('-32', '%d')
                    .should.eql([-32]);
            });

            it('returns NaN if cannot parse number', function() {
                scan('foo bar', '%d')
                    .should.eql([NaN]);
            });

            it('supports field width', function() {
                scan('123', '%2d')
                    .should.eql([12]);

                scan('-10', '%1d')
                    .should.eql([NaN]);
            });

            it('allows to omit parsed value from results', function() {
                scan('223 8', '%*d %d')
                    .should.eql([8]);
            });

            it('supports named arguments', function() {
                scan('55 57', '%{x}d %{y}d')
                    .should.eql({ x:55, y:57 });
            });
        });

        describe('%u specifier', function() {
            it('allows to read 32bit unsigned integer', function() {
                scan('4466', '%u')
                    .should.eql([4466]);

                scan('-1', '%u')
                    .should.eql([4294967295]);

                scan('-37', '%u')
                    .should.eql([4294967259]);

                scan('+77', '%u')
                    .should.eql([77]);
            });

            it('returns NaN if cannot parse number', function() {
                scan('foo', '%u')
                    .should.eql([NaN]);
            });

            it('supports field width', function() {
                scan('111213', '%1u%2u%3u')
                    .should.eql([1, 11, 213]);
            });

            it('allows to omit parsed value from results', function() {
                scan('3 4 5', '%u %*u %u')
                    .should.eql([3, 5]);
            });

            it('supports named arguments', function() {
                scan('3 4', '%{x}u %{y}u')
                    .should.eql({ x:3, y:4 });
            });
        });

        describe('%i specifier', function() {
            it('allows to read hex number', function() {
                scan('0xff', '%i')
                    .should.eql([255]);

                scan('-0X10', '%i')
                    .should.eql([-16]);
            });

            it('allows to read decimal number', function() {
                scan('335', '%i')
                    .should.eql([335]);

                scan('-3', '%i')
                    .should.eql([-3]);
            });

            it('allows to read octal number', function() {
                scan('077', '%i')
                    .should.eql([parseInt('77',8)]);

                scan('-0234', '%i')
                    .should.eql([parseInt('-234',8)]);
            });

            it('returns NaN if cannot parse number', function() {
                scan('0zz', '%i')
                    .should.eql([NaN]);

                scan('-089', '%i')
                    .should.eql([NaN]);

                scan('0xzz', '%i')
                    .should.eql([NaN]);

                scan('-0xj7', '%i')
                    .should.eql([NaN]);

                scan('abc', '%i')
                    .should.eql([NaN]);
            });
        
            it('supports width field', function() {
                scan('0xff0x10', '%4i%4i')
                    .should.eql([255,16]);

                scan('0701', '%2i%2i')
                    .should.eql([7,1]);

                scan('3355', '%2i%4i')
                    .should.eql([33, 55]);
            });

            it('allows to omit parsed value from results', function() {
                scan('0xcafe 356 0732 22', '%*i %i %*i %i')
                    .should.eql([356, 22]);
            });

            it('supports named arguments', function() {
                scan('0x10 0x0f', '%{x}i %{y}i')
                    .should.eql({ x:0x10, y:0x0f });
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
