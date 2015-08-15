(function() {
    'use strict';

    var chai = require('chai');

    chai.should();

    var scan = require('../src/scan.js').scan;

    var oct = function(n) { return parseInt(n, 8); };

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

        describe('%x specifier', function() {
            it('allows to read hex number with optional sign', function() {
                scan('0x123', '%x')
                    .should.eql([0x123]);

                scan('0XBAD5', '%x')
                    .should.eql([0xbad5]);

                scan('+0x4a4', '%x')
                    .should.eql([0x4a4]);

                scan('0x0', '%x')
                    .should.eql([0]);

                // %x returns unsigned number
                scan('-0x32f', '%x')
                    .should.eql([4294966481]);
            });

            it('allows to read hex number without 0x prefix', function() {
                scan('cafe', '%x')
                    .should.eql([0xcafe]);

                scan('babe', '%x')
                    .should.eql([0xbabe]);

                // %x returns unsigned number
                scan('-1', '%x')
                    .should.eql([0xffffffff]);

                scan('223', '%x')
                    .should.eql([0x223]);
            });

            it('returns NaN if cannot parse number', function() {
                scan('zoo bar', '%x')
                    .should.eql([NaN]);
            });

            it('supports field width', function() {
                scan('0x123', '%3x')
                    .should.eql([1]);

                // %x - returns unsigned numbers
                scan('-0x103', '%4x')
                    .should.eql([0xffffffff]);

                scan('-0x34', '%3x')
                    .should.eql([NaN]);
            });

            it('allows to omit parsed value from results', function() {
                scan('0xff 0xcc 0xdd', '%x %*x %x')
                    .should.eql([0xff, 0xdd]);
            });

            it('supports named arguments', function() {
                scan('0x55 0x57', '%{x}x %{y}x')
                    .should.eql({ x:0x55, y:0x57 });
            });
        });

        describe('%o specifier', function() {
            it('allows to read octal number with optional sign', function() {
                scan('0123', '%o')
                    .should.eql([oct('123')]);

                scan('+044', '%o')
                    .should.eql([oct('44')]);

                scan('0', '%o')
                    .should.eql([0]);

                // %o returns unsigned number
                scan('-032', '%o')
                    .should.eql([4294967270]);
            });

            it('allows to read octal number without zero prefix', function() {
                scan('77', '%o')
                    .should.eql([oct('77')]);

                // %o returns unsigned number
                scan('-12', '%o')
                    .should.eql([4294967286]);
            });

            it('returns NaN if cannot parse number', function() {
                scan('foo bar', '%o')
                    .should.eql([NaN]);
            });

            it('supports field width', function() {
                scan('123', '%2o')
                    .should.eql([oct('12')]);

                scan('-10', '%1o')
                    .should.eql([NaN]);
            });

            it('allows to omit parsed value from results', function() {
                scan('223 7', '%*o %o')
                    .should.eql([7]);
            });

            it('supports named arguments', function() {
                scan('55 57', '%{x}o %{y}o')
                    .should.eql({ x:oct('55'), y:oct('57') });
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

            it('allows to read zero and minus zero', function() {
                scan('0', '%i')
                    .should.eql([0]);

                scan('-0', '%i')
                    .should.eql([-0]);
            });

            it('returns NaN if cannot parse number', function() {
                // ambiguity between dec 0 and invalid oct number
                scan('0zz', '%i')
                    .should.eql([0]);

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

        describe('%f %e %g specifiers', function() {
            it('allows to read floating point number', function() {
                scan('1435', '%f')
                    .should.eql([1435]);

                scan('3.3245', '%f')
                    .should.eql([3.3245]);

                scan('3.23e+05', '%f')
                    .should.eql([3.23e+5]);

                scan('-34.54', '%f')
                    .should.eql([-34.54]);

                scan('-3.43e-8', '%f')
                    .should.eql([-3.43e-8]);

                scan('0 -0', '%f %f')
                    .should.eql([0, -0]);
            });

            it('allows to read special values: Infinity and NaN', function() {
                scan('Infinity', '%f')
                    .should.eql([Infinity]);

                scan('+Infinity', '%f')
                    .should.eql([Infinity]);

                scan('-Infinity', '%f')
                    .should.eql([-Infinity]);

                scan('NaN', '%f')
                    .should.eql([NaN]);
            });

            it('returns NaN if cannot parse number', function() {
                scan('fcde.bbd', '%f')
                    .should.eql([NaN]);

                scan('', '%f')
                    .should.eql([NaN]);
            });

            it('supports field width', function() {
                scan('11.54', '%2f')
                    .should.eql([11]);

                scan('11.54', '%4f')
                    .should.eql([11.5]);

                scan('11.54 f', '%10f')
                    .should.eql([11.54]);

                scan('-32.3', '%1f')
                    .should.eql([NaN]);

                scan('-334.432e3', '%4f')
                    .should.eql([-334]);
            });

            it('allows to omit parsed value from results', function() {
                scan('3.32 1e10 5e2', '%f %*f %f')
                    .should.eql([3.32, 5.0e2]);
            });

            it('supports named arguments', function() {
                scan('0.32 0.21', '%{x}f %{y}f')
                    .should.eql({ x:0.32, y:0.21 });
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
