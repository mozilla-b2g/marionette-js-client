VENDOR=./vendor

.PHONY: .vendor

vendor :
	rm -Rf $(VENDOR)/*
	cp ./node_modules/superagent/superagent.js $(VENDOR)
	cp ./node_modules/superagent/superagent.min.js $(VENDOR)
	cp ./node_modules/expect.js/expect.js $(VENDOR)
	cp ./node_modules/test-agent/test-agent.js $(VENDOR)

