# Marionette JS Client

## Hacking

### Install

Fork repo

```` sh
npm install .
````

### Running tests

Node:

```` sh
make test-node
````

Browser:

```` sh
make package
make test-server
# GOTO: http://localhost:8789/test-agent/index.html in your browser

make test-browser
# you can also use
# "make test" to run both node and browser tests.
````