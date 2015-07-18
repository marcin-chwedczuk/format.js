(function() {
    'use strict';

    var chai = require('chai');
    var expect = chai.expect;

    chai.should();

    var scan = require('../src/scan.js').scan;

    describe("scan()", function() {
        it("is implemented", function() {
            expect(scan).to.throw();
        });
    });

}());
