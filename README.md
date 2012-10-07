# Marionette JS Client

JavaScript client for
[Marionette](https://developer.mozilla.org/en-US/docs/Marionette).

Designed to run on nodejs & xpcshell.

- [Api Docs](http://lightsofapollo.github.com/marionette_js_client/api-docs/)

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

``` sh
make package
make test-server
# GOTO: http://localhost:8789/test-agent/index.html in your browser

make test-browser
# you can also use
# "make test" to run both node and browser tests.
```
