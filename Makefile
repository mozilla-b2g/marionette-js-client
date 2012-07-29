# what OS are we on?
SYS=$(shell uname -s)
ARCH=$(shell uname -m)

VENDOR=./vendor/
REPORTER=spec
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

.PHONY: docs .vendor test test-node test-browser test-xpc

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
	cat ./lib/marionette/error.js >> $(DEV_FILE)
	cat ./lib/marionette/xhr.js >> $(DEV_FILE)
	cat ./lib/marionette/command-stream.js >> $(DEV_FILE)
	cat ./lib/marionette/element.js >> $(DEV_FILE)
	cat ./lib/marionette/client.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/abstract.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/websocket.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/moz-tcp.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/httpd-polling.js >> $(DEV_FILE)
	cat ./lib/marionette/drivers/index.js >> $(DEV_FILE)
	cat ./lib/marionette/index.js >> $(DEV_FILE)

test : package test-node test-browser test-xpc

test-browser:
	@echo "NOTICE: You must have a client connected to test agent."
	./node_modules/test-agent/bin/js-test-agent test --reporter $(REPORTER)

XPC_TEST_FILES=test/marionette/*-test.js \
	test/marionette/drivers/abstract-test.js \
	test/marionette/drivers/moz-tcp-test.js

test-xpc: install-xulrunner
	PATH=$$PWD/xulrunner-sdk/bin:$$PATH ./node_modules/xpcwindow/bin/xpcwindow xpc-test.js $(XPC_TEST_FILES)

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

# The below is stolen from the gaia makefile

# The install-xulrunner target arranges to get xulrunner downloaded and sets up
# some commands for invoking it. But it is platform dependent
XULRUNNER_BASE_URL=http://ftp.mozilla.org/pub/mozilla.org/xulrunner
ifeq ($(SYS),Darwin)
# We're on a mac
XULRUNNER_DOWNLOAD=$(XULRUNNER_BASE_URL)/nightly/2012/05/2012-05-08-03-05-17-mozilla-central/xulrunner-15.0a1.en-US.mac-x86_64.sdk.tar.bz2
XULRUNNER=./xulrunner-sdk/bin/run-mozilla.sh
XPCSHELL=./xulrunner-sdk/bin/xpcshell

install-xulrunner:
	test -d xulrunner-sdk || ($(DOWNLOAD_CMD) $(XULRUNNER_DOWNLOAD) && tar xjf xulrunner*.tar.bz2 && rm xulrunner*.tar.bz2)

else
# Not a mac: assume linux
# Linux only!
# downloads and installs locally xulrunner to run the xpchsell
# script that creates the offline cache
ifeq ($(ARCH),x86_64)
XULRUNNER_DOWNLOAD=$(XULRUNNER_BASE_URL)/releases/11.0/runtimes/xulrunner-11.0.en-US.linux-x86_64.tar.bz2
else
XULRUNNER_DOWNLOAD=$(XULRUNNER_BASE_URL)/releases/11.0/runtimes/xulrunner-11.0.en-US.linux-i686.tar.bz2
endif
XULRUNNER=./xulrunner/run-mozilla.sh
XPCSHELL=./xulrunner/xpcshell

install-xulrunner :
	test -d xulrunner || ($(DOWNLOAD_CMD) $(XULRUNNER_DOWNLOAD) && tar xjf xulrunner*.tar.bz2 && rm xulrunner*.tar.bz2)
endif
