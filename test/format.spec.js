(function() {
    'use strict';

    var chai = require('chai');
    var expect = chai.expect;

    chai.should();

    var format = require('../src/format.js').format;

    describe("format()", function() {
        it("is implemented", function() {
            expect(format).to.throw();
        });
    });

}());
