VENDOR=./vendor/
REPORTER=Spec

.PHONY: .vendor test test-node test-browser

test-server:
	./node_modules/test-agent/bin/js-test-agent server --growl

package :
	rm -Rf $(VENDOR)/
	mkdir $(VENDOR)
	cp ./node_modules/mocha/mocha.js $(VENDOR)
	cp ./node_modules/mocha/mocha.css $(VENDOR)
	cp ./node_modules/expect.js/expect.js $(VENDOR)
	cp ./node_modules/test-agent/test-agent.js $(VENDOR)
	cp ./node_modules/test-agent/test-agent.css $(VENDOR)

test : test-node test-browser

test-browser:
	@echo "NOTICE: You must have a client connected to test agent."
	./node_modules/test-agent/bin/js-test-agent test --reporter $(REPORTER)

test-node:
	./node_modules/mocha/bin/mocha --reporter $(REPORTER) ./test/helper.js \
	  ./test/node/*-test.js \
	  ./test/marionette/client-test.js \
	  ./test/marionette/element-test.js \
	  ./test/marionette/drivers/abstract-test.js \
	  ./test/marionette/drivers/websocket-test.js
