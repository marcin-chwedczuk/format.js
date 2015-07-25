(function() {
    'use strict';

    var chai = require('chai');
    // var expect = chai.expect;
    chai.should();

    var BigInt = require('../src/bigint.js').BigInt;

    var rand = function(max) {
        return Math.floor(Math.random() * max);
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
    });

}());

 
