# what OS are we on?
SYS=$(shell uname -s)
ARCH=$(shell uname -m)

VENDOR=./vendor/
REPORTER=spec
BROWSER_REPORTER=Spec
DEV_FILE=./marionette.js

ifeq ($(SYS),Darwin)
MD5SUM = md5 -r
SED_INPLACE_NO_SUFFIX = sed -i ''
DOWNLOAD_CMD = curl -s -O
else
MD5SUM = md5sum -b
SED_INPLACE_NO_SUFFIX = sed -i
DOWNLOAD_CMD = wget
endif

# doc variables
YUIDOCJS?=./node_modules/yuidocjs/lib/cli.js
DOC_PARAMS?=--themedir ./docs/theme
DOC_DIR=./lib/marionette

.PHONY: package
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
	cat ./lib/marionette/error.js >> $(DEV_FILE)
	cat ./lib/marionette/xhr.js >> $(DEV_FILE)
	cat ./lib/marionette/command-stream.js >> $(DEV_FILE)
	cat ./lib/marionette/element.js >> $(DEV_FILE)
	cat ./lib/marionette/client.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/abstract.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/websocket.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/moz-tcp.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/httpd-polling.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/http-proxy.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/index.js >> $(DEV_FILE)
	cat ./lib/marionette/index.js >> $(DEV_FILE)

.PHONY: test-server
test-server:
	./node_modules/test-agent/bin/js-test-agent server --growl

.PHONY: doc-server
doc-server:
	$(YUIDOCJS) $(DOC_PARAMS) --server $(DOC_DIR)

.PHONY: doc-publish
doc-publish:
	$(YUIDOCJS) $(DOC_PARAMS) -o ./api-docs-temp/ $(DOC_DIR) -c ./yuidoc.json
	git checkout gh-pages
	rm -Rf api-docs
	mv api-docs-temp api-docs
	git add api-docs
	git commit -m "regenerate api docs"
	git push origin gh-pages --force
	git checkout master
	rm -Rf api-docs-temp/

.PHONY: test
test : package test-node test-browser test-xpc

.PHONY: test-browser
test-browser:
	@echo "NOTICE: You must have a client connected to test agent."
	./node_modules/test-agent/bin/js-test-agent test --reporter $(BROWSER_REPORTER)

XPC_TEST_FILES=test/marionette/*-test.js \
	test/marionette/drivers/abstract-test.js \
	test/marionette/drivers/moz-tcp-test.js

.PHONY: test-xpc
test-xpc:
	./node_modules/xpcwindow/bin/xpcwindow-mocha test/xpc-helper.js $(XPC_TEST_FILES)

.PHONY: test-node
test-node:
	./node_modules/mocha/bin/mocha --reporter $(REPORTER) ./test/helper.js \
	  ./test/node/*-test.js \
	  ./test/marionette/index-test.js \
	  ./test/marionette/command-stream-test.js \
	  ./test/marionette/xhr-test.js \
	  ./test/marionette/client-test.js \
	  ./test/marionette/error-test.js \
	  ./test/marionette/element-test.js \
	  ./test/marionette/drivers/abstract-test.js \
	  ./test/marionette/drivers/tcp-test.js \
	  ./test/marionette/drivers/websocket-test.js \
	  ./test/marionette/drivers/httpd-polling-test.js
