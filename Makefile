REPORTER=spec

# doc variables
YUIDOCJS?=./node_modules/yuidocjs/lib/cli.js
DOC_PARAMS?=--themedir ./docs/theme
DOC_DIR=./lib/marionette


.PHONY: link
link:
	npm link
	npm link marionette-client

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
	git add -f api-docs
	git commit -m "regenerate api docs"
	git push origin gh-pages --force
	git checkout master
	rm -Rf api-docs-temp/

.PHONY: test
test : test-unit test-integration

b2g:
	./node_modules/.bin/mozilla-download --product b2g --verbose $@

.PHONY: test-integration
test-integration: link b2g
	./node_modules/.bin/marionette-mocha --reporter $(REPORTER) \
		--profile-base $(PWD)/profile.js \
		--ui tdd \
		--timeout 30s \
		$(shell find test/integration -name "*-test.js")

.PHONY: test-node
test-unit:
	./node_modules/mocha/bin/mocha --reporter $(REPORTER) \
	  ./test/node/*-test.js \
	  ./test/marionette/index-test.js \
	  ./test/marionette/command-stream-test.js \
	  ./test/marionette/client-test.js \
	  ./test/marionette/error-test.js \
	  ./test/marionette/element-test.js \
	  ./test/marionette/actions-test.js \
	  ./test/marionette/multi-actions-test.js \
	  ./test/marionette/drivers/abstract-test.js \
	  ./test/marionette/drivers/tcp-test.js \
	  ./test/marionette/drivers/tcp-sync-test.js


.PHONY: ci
ci:
	Xvfb :99 &
	DISPLAY=:99 make test

