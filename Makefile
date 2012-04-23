VENDOR=./vendor/
REPORTER=spec

.PHONY: .vendor test

test_server:
	./node_modules/test-agent/bin/js-test-agent server --growl

package :
	rm -Rf $(VENDOR)/
	mkdir $(VENDOR)
	cp ./node_modules/mocha/mocha.js $(VENDOR)
	cp ./node_modules/mocha/mocha.css $(VENDOR)
	cp ./node_modules/expect.js/expect.js $(VENDOR)
	cp ./node_modules/test-agent/test-agent.js $(VENDOR)

test :
	./node_modules/mocha/bin/mocha --reporter $(REPORTER) ./test/helper.js ./test/node/*-test.js
