VENDOR=./vendor/
REPORTER=Spec
DEV_FILE=./marionette.js

.PHONY: docs .vendor test test-node test-browser

test-server:
	./node_modules/test-agent/bin/js-test-agent server --growl

docs:
	mkdir -p docs/api
	rm -Rf ./docs/api/
	./node_modules/jsdoc-toolkit/app/run.js --recurse=10 -p -a -d=./docs/api/ -t=./build/jsdoc-template/ ./lib/


package :
	rm -Rf $(VENDOR)/
	mkdir $(VENDOR)
	cp ./node_modules/mocha/mocha.js $(VENDOR)
	cp ./node_modules/mocha/mocha.css $(VENDOR)
	cp ./node_modules/expect.js/expect.js $(VENDOR)
	cp ./node_modules/test-agent/test-agent.js $(VENDOR)
	cp ./node_modules/test-agent/test-agent.css $(VENDOR)

	rm -f $(DEV_FILE)
	touch $(DEV_FILE)
	
	cat ./node_modules/test-agent/lib/test-agent/responder.js >> $(DEV_FILE)
	cat ./node_modules/test-agent/lib/test-agent/websocket-client.js >> $(DEV_FILE)
	cat ./lib/marionette/marionette.js >> $(DEV_FILE)
	cat ./lib/marionette/xhr.js >> $(DEV_FILE)
	cat ./lib/marionette/command-stream.js >> $(DEV_FILE)
	cat ./lib/marionette/element.js >> $(DEV_FILE)
	cat ./lib/marionette/client.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/abstract.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/websocket.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/httpd-polling.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/index.js >> $(DEV_FILE)
	cat ./lib/marionette/index.js >> $(DEV_FILE)

test : package test-node test-browser

test-browser:
	@echo "NOTICE: You must have a client connected to test agent."
	./node_modules/test-agent/bin/js-test-agent test --reporter $(REPORTER)

test-node:
	./node_modules/mocha/bin/mocha --reporter $(REPORTER) ./test/helper.js \
	  ./test/node/*-test.js \
	  ./test/marionette/index-test.js \
	  ./test/marionette/command-stream-test.js \
	  ./test/marionette/xhr-test.js \
	  ./test/marionette/client-test.js \
	  ./test/marionette/element-test.js \
	  ./test/marionette/drivers/abstract-test.js \
	  ./test/marionette/drivers/tcp-test.js \
	  ./test/marionette/drivers/websocket-test.js \
	  ./test/marionette/drivers/httpd-polling-test.js
