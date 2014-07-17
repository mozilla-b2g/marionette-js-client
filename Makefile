REPORTER=spec

# doc variables
YUIDOCJS?=./node_modules/yuidocjs/lib/cli.js
DOC_PARAMS?=--themedir ./docs/theme
DOC_DIR=./lib/marionette
DOC_REMOTE?=upstream


.PHONY: link
link:
	npm link
	npm link marionette-client

.PHONY: test-server
test-server: node_modules
	./node_modules/test-agent/bin/js-test-agent server --growl

.PHONY: doc-server
doc-server: node_modules
	$(YUIDOCJS) $(DOC_PARAMS) --server $(DOC_DIR)

.PHONY: doc-publish
doc-publish: node_modules
	git fetch $(DOC_REMOTE)
	git checkout --detach
	git branch -D gh-pages || true
	git branch gh-pages $(DOC_REMOTE)/gh-pages
	git checkout -
	git checkout gh-pages
	$(YUIDOCJS) $(DOC_PARAMS) -o ./api-docs-temp/ $(DOC_DIR) -c ./yuidoc.json
	rm -Rf api-docs
	mv api-docs-temp api-docs
	git add -f api-docs
	git commit -m "regenerate api docs"
	git push $(DOC_REMOTE) gh-pages
	git checkout -
	rm -Rf api-docs-temp/

.PHONY: test
test : test-unit test-integration

b2g:
	./node_modules/.bin/mozilla-download --product b2g --verbose $@

.PHONY: test-integration
test-integration: link b2g node_modules
	./node_modules/.bin/marionette-mocha --reporter $(REPORTER) \
		--profile-base $(PWD)/profile.js \
		--ui tdd \
		--timeout 30s \
		$(shell find test/integration -name "*-test.js")

.PHONY: test-unit
test-unit: node_modules
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

node_modules: package.json
	npm install
