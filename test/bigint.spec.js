(function() {
    'use strict';

    var chai = require('chai');
    // var expect = chai.expect;
    chai.should();

    var BigInt = require('../src/bigint.js').BigInt;

    var rand = function(max) {
        return Math.floor(Math.random() * max);
    };

    var bin = function(n) {
        return n.toString(2);
    };

    describe('bignum', function() {
        it('allows to create numbers from binary digits', function() {
            BigInt
                .fromBinary('110010110')
                .toBinaryString()
                .should.equal('110010110');

            BigInt
                .fromBinary('+11001')
                .toBinaryString()
                .should.equal('11001');

            BigInt
                .fromBinary('-01011')
                .toBinaryString()
                .should.equal('-1011');
        });

        it('can add two numbers of the same sign', function() {
            BigInt
                .fromBinary('101')
                .add(BigInt.fromBinary('10'))
                .toBinaryString()
                .should.equal('111');

            BigInt
                .fromBinary('111')
                .add(BigInt.fromBinary('1'))
                .toBinaryString()
                .should.equal('1000');

            BigInt
                .fromBinary('0')
                .add(BigInt.fromBinary('1010'))
                .toBinaryString()
                .should.equal('1010');

            BigInt
                .fromBinary('1111')
                .add(BigInt.fromBinary('1111'))
                .toBinaryString()
                .should.equal('11110');
        });

        it('can add two numbers of opposite signs', function() {
            BigInt
                .fromBinary('-101')
                .add(BigInt.fromBinary('101'))
                .isZero()
                .should.equal(true);

            BigInt
                .fromBinary('1000')
                .add(BigInt.fromBinary('-1'))
                .toBinaryString()
                .should.equal('111');
        });

        it('add stress test', function() {
            var MAX_TESTS = 1000;

            for (var i = 0; i < MAX_TESTS; i += 1) {
                var n1 = rand(2000) - 1000;
                var n2 = rand(2000) - 1000;

                BigInt
                    .fromBinary(n1.toString(2))
                    .add(BigInt.fromBinary(n2.toString(2)))
                    .toBinaryString()
                    .should.equal((n1+n2).toString(2));
            }
        });

        it('can multiply number by positive number', function() {
            BigInt
                .fromBinary('101011')
                .mul(BigInt.fromBinary('100'))
                .toBinaryString()
                .should.equal('10101100');
        
            BigInt
                .fromBinary('101110')
                .mul(BigInt.zero())
                .toBinaryString()
                .should.equal('0');

            BigInt
                .fromBinary('1011101')
                .mul(BigInt.one())
                .toBinaryString()
                .should.equal('1011101');
        });

        it('mul stress test', function() {
            var MAX_TESTS = 1000;

            for (var i = 0; i < MAX_TESTS; i += 1) {
                var n1 = rand(1000);
                var n2 = rand(1000);

                BigInt
                    .fromBinary(n1.toString(2))
                    .mul(BigInt.fromBinary(n2.toString(2)))
                    .toBinaryString()
                    .should.equal((n1*n2).toString(2));
            }
        });

        it('can divide number by number', function() {
            BigInt
                .fromBinary('100')
                .div(BigInt.fromBinary('1'))
                .toBinaryString()
                .should.equal('100');

            BigInt
                .fromBinary('100')
                .div(BigInt.fromBinary('10'))
                .toBinaryString()
                .should.equal('10');

            BigInt
                .fromBinary('101')
                .div(BigInt.fromBinary('10'))
                .toBinaryString()
                .should.equal('10');

            BigInt
                .fromBinary('11')
                .div(BigInt.fromBinary('100'))
                .toBinaryString()
                .should.equal('0');
        });

        it('div stress test', function() {
            var MAX_TESTS = 1000;

            for (var i = 0; i < MAX_TESTS; i += 1) {
                var n1 = rand(1000);
                var n2 = rand(1000) + 1;

                BigInt
                    .fromBinary(n1.toString(2))
                    .div(BigInt.fromBinary(n2.toString(2)))
                    .toBinaryString()
                    .should.equal(Math.floor(n1/n2).toString(2));
            }
        });

        it('can compute remainder', function() {
            BigInt
                .fromBinary(bin(403))
                .mod(BigInt.fromBinary(bin(13)))
                .toBinaryString()
                .should.equal(bin(403 % 13));

            BigInt
                .fromBinary(bin(121))
                .mod(BigInt.fromBinary(bin(1)))
                .isZero()
                .should.equal(true);

            BigInt
                .fromBinary(bin(123))
                .mod(BigInt.fromBinary(bin(10)))
                .toBinaryString()
                .should.equal(bin(3));
        });

        it('mod stress test', function() {
            var MAX_TESTS = 1000;

            for (var i = 0; i < MAX_TESTS; i += 1) {
                var n1 = rand(1000);
                var n2 = rand(1000) + 1;

                BigInt
                    .fromBinary(n1.toString(2))
                    .mod(BigInt.fromBinary(n2.toString(2)))
                    .toBinaryString()
                    .should.equal(Math.floor(n1%n2).toString(2));
            }
        });
    });

    it('can be created from decimal number string', function() {
        BigInt
            .fromDecimal('1293')
            .toBinaryString()
            .should.equal(bin(1293));

        BigInt
            .fromDecimal('-33')
            .toBinaryString()
            .should.equal(bin(-33));

        BigInt
            .fromDecimal('0')
            .toBinaryString()
            .should.equal('0');

        BigInt
            .fromDecimal('999')
            .toBinaryString()
            .should.equal(bin(999));
    });

    xit('can be converted to binary string', function() {
        BigInt
            .fromDecimal('123456')
            .toDecimalString()
            .should.equal('123456');

        BigInt
            .fromDecimal('0')
            .toDecimalString()
            .should.equal('0');

        BigInt
            .fromDecimal('-888')
            .toDecimalString()
            .should.equal('-888');
    });

    it('can check if two numbers are equal', function() {
        BigInt
            .fromDecimal('101')
            .isEqual(BigInt.fromDecimal('101'))
            .should.equal(true);

        BigInt
            .fromDecimal('101')
            .isEqual(BigInt.fromDecimal('-101'))
            .should.equal(false);

        BigInt
            .fromDecimal('0')
            .isEqual(BigInt.zero())
            .should.equal(true);

        BigInt.one()
            .isEqual(BigInt.zero())
            .should.equal(false);
    });

    it('isEqual stress test', function() {
        var MAX_TESTS = 1000;

        for (var i = 0; i < MAX_TESTS; i += 1) {
            var n1 = rand(50) - 25;
            var n2 = rand(50) - 25;

            BigInt
                .fromBinary(n1.toString(2))
                .isEqual(BigInt.fromBinary(n2.toString(2)))
                .should.equal(n1 === n2);
        }
    });

    it('can check if one number is lower than other', function() {
        BigInt.zero()
            .isLowerThan(BigInt.zero())
            .should.equal(false);

        BigInt.zero()
            .isLowerThan(BigInt.one())
            .should.equal(true);

        BigInt
            .fromDecimal('10')
            .isLowerThan(BigInt.fromDecimal('3'))
            .should.equal(false);

        BigInt
            .fromDecimal('3')
            .isLowerThan(BigInt.fromDecimal('10'))
            .should.equal(true);

        BigInt
            .fromDecimal('332')
            .isLowerThan(BigInt.fromDecimal('-33'))
            .should.equal(false);

        BigInt
            .fromDecimal('-33')
            .isLowerThan(BigInt.fromDecimal('332'))
            .should.equal(true);

        BigInt
            .fromDecimal('-7')
            .isLowerThan(BigInt.fromDecimal('-3'))
            .should.equal(true);

        BigInt
            .fromDecimal('-32')
            .isLowerThan(BigInt.fromDecimal('-100'))
            .should.equal(false);
    });

    it('isLowerThan stress tests', function() {
        var MAX_TESTS = 1000;

        for (var i = 0; i < MAX_TESTS; i += 1) {
            var n1 = rand(500) - 250;
            var n2 = rand(500) - 250;

            BigInt
                .fromBinary(n1.toString(2))
                .isLowerThan(BigInt.fromBinary(n2.toString(2)))
                .should.equal(n1 < n2);
        } 
    });

    it('can check if number is lower or equal to other number', function() {
        BigInt.zero()
            .isLowerOrEqual(BigInt.zero())
            .should.equal(true);

        BigInt.zero()
            .isLowerOrEqual(BigInt.one())
            .should.equal(true);

        BigInt.one()
            .isLowerOrEqual(BigInt.zero())
            .should.equal(false);
    });

    it('can check if number is greater than other number', function() {
        BigInt
            .fromDecimal('3321')
            .isGreaterThan(BigInt.fromDecimal('66'))
            .should.equal(true);

        BigInt
            .fromDecimal('332')
            .isGreaterThan(BigInt.fromDecimal('332'))
            .should.equal(false);

        BigInt
            .fromDecimal('3322')
            .isGreaterThan(BigInt.fromDecimal('3333333'))
            .should.equal(false);
    });

    it('can check if number is greater or equal to other number', function() {
        BigInt
            .fromDecimal('3321')
            .isGreaterOrEqual(BigInt.fromDecimal('66'))
            .should.equal(true);

        BigInt
            .fromDecimal('332')
            .isGreaterOrEqual(BigInt.fromDecimal('332'))
            .should.equal(true);

        BigInt
            .fromDecimal('3322')
            .isGreaterOrEqual(BigInt.fromDecimal('3333333'))
            .should.equal(false);
    });

    it('can be created from JS integer', function() {
        BigInt.of(32125)
            .toBinaryString()
            .should.equal(bin(32125));

        BigInt.of(-321)
            .isEqual(BigInt.fromDecimal('-321'))
            .should.equal(true);
    });

    it('can be converted to decimal string', function() {
        BigInt.zero()
            .toDecimalString()
            .should.equal('0');

        BigInt.of(33219)
            .toDecimalString()
            .should.equal('33219');

        BigInt.of(-6677)
            .toDecimalString()
            .should.equal('-6677');
    });

    it('toDecimalString() stres test', function() {
        var MAX_TESTS = 1000;

        for (var i = 0; i < MAX_TESTS; i += 1) {
            var n1 = rand(1000) - 500;

            BigInt.of(n1)
                .toDecimalString()
                .should.equal(n1.toString());
        }
        
    });

    it('allows to read bit from digit', function() {
        var two = BigInt.fromBinary('10');

        two.bitAt(-1).should.equal(0);
        two.bitAt(0).should.equal(0);
        two.bitAt(1).should.equal(1);
        two.bitAt(2).should.equal(0);
    });

}());

 
