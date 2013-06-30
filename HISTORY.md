# 0.8
  - .scope method for making context/timeout transitions/restorations
    trivial
  - .waitFor method for polling from test runner environment -> host
# 0.7
  - remember which context the client is in.

# 0.6
  - sync api via http proxy bridge & other horrible/crazy/awesome
hacks.

# 0.5.7
  - wait much longer for marionette tcp socket to become available.

# 0.5.6
  - callbacks are no longer required in all operations.
    default callbacks are noop.

# 0.5.5
  - fix bug where tcp could not accept options
  - add support for trying tcp connection if it fails.
# 0.5.4
  - remove test-agent dep

# 0.5.2
 - Allow objects that look like elements act like element in
switchToFrame 

# 0.5.1
  - Make it easier to override default element

# 0.5.0
  - Update MozTCP socket api
  - update to latest xpcwindow
  - node debug style logging for xpcwindow runner

# 0.4.1
  - Better MozTCP support.

# 0.4.0
  - XPC Shell support via xpcwindow. 

# 0.3.2
  - Adding compat for xpcwindow

# 0.3.1
  - Major internal rewrite of module definition.

  - Upgraded test-agent deps to 0.5.4 from ~0.3

# 0.3.0
  - Adding TCP driver for node

# 0.2.0
  - Added support for wrapping/unwrapping elements
    in script functions.

  - executeScript, executeJsScript, executeAsyncScript now accept
     either a string or a function as the script argument.
 
  - Added .scriptWith function to Marionette.Element that will
    automatally pass that element to a remote script.

# 0.1.1
  - Reenable executeAsyncScript it will work
    in b2g with generators.

# 0.1.0
  - HttpPolling driver now supported in node.
  - goUrl command is now supported.
  - getAttribute was updated to support newer marionette.
  - Error handling for when connections fail to be setup (connect in
    drivers)

  - Fixed error related to out of order responses if chaining directly
    after connect.

  - close method to be supported in drivers to closing marionette
    connections.

# 0.0.2
  - marionette.js cleanup and cosmetic fixes.

# 0.0.1
  - Initial release with support for the majority of all marionette
    server commands. No error handling in client though.
