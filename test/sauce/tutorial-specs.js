var wd = require('wd');
require('colors');
var _ = require('lodash');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

// checking sauce credential
if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    console.warn(
        '\nPlease configure your sauce credential:\n\n' +
        'export SAUCE_USERNAME=<SAUCE_USERNAME>\n' +
        'export SAUCE_ACCESS_KEY=<SAUCE_ACCESS_KEY>\n\n'
    );
    throw new Error('Missing sauce credentials');
}

// http configuration, not needed for simple runs
wd.configureHttp({
    timeout: 60000,
    retryDelay: 15000,
    retries: 5
});

var desired = JSON.parse(process.env.DESIRED || '{browserName: "chrome"}');
desired.name = 'example with ' + desired.browserName;
desired.tags = ['tutorial'];

describe('tutorial (' + desired.browserName + ')', function() {
    var browser;
    var allPassed = true;

    before(function(done) {
        var username = process.env.SAUCE_USERNAME;
        var accessKey = process.env.SAUCE_ACCESS_KEY;
        browser = wd.promiseChainRemote('ondemand.saucelabs.com', 80, username, accessKey);
        if (process.env.VERBOSE) {
            // optional logging
            browser.on('status', function(info) {
                console.log(info.cyan);
            });
            browser.on('command', function(meth, path, data) {
                console.log(' > ' + meth.yellow, path.grey, data || '');
            });
        }
        browser
            .init(desired)
            .nodeify(done);
    });

    afterEach(function(done) {
        allPassed = allPassed && (this.currentTest.state === 'passed');
        done();
    });

    after(function(done) {
        browser
            .quit()
            .sauceJobStatus(allPassed)
            .nodeify(done);
    });

    it('should get home page', function(done) {
        browser
            .get('http://starwars.com')
            .title()
            .should.become('StarWars.com | The Official Star Wars Website')
            .elementById('copyright')
            .text()
            .should.eventually.include('TM & © Lucasfilm Ltd. All Rights Reserved')
            .nodeify(done);
    });

    _.times(2, function(i) { // repeat twice

        it('should go to the film page (' + i + ')', function(done) {
            browser
                .elementByCss('nav#nav-content a[href="/films"]')
                .click()
                .title()
                .should.eventually.include('Star Wars Movies | StarWars.com')
                .nodeify(done);
        });

        it('should return to the home page(' + i + ')', function(done) {
            browser
                .elementByCss('a#nav-sw-logo-bar')
                .click()
                .title()
                .should.not.eventually.include('Star Wars Movies')
                .nodeify(done);
        });


    });
});
