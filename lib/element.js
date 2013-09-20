/**
 * Creates an element reference
 * based on an id and a client instance.
 * You should never need to manually create
 * an instance of element.
 *
 * Use {{#crossLink "Marionette.Client/findElement"}}{{/crossLink}} or
 * {{#crossLink "Marionette.Client/findElements"}}{{/crossLink}} to create
 * instance(s) of this class.
 *
 * @class Marionette.Element
 * @param {String} id id of element.
 * @param {Marionette.Client} client client instance.
 */
function Element(id, client) {
  this.id = id;
  this.client = client;
}

Element.prototype = {
  /**
   * Sends remote command processes the result.
   * Appends element id to each command.
   *
   * @method _sendCommand
   * @chainable
   * @private
   * @param {Object} command marionette request.
   * @param {String} responseKey key in the response to pass to callback.
   * @param {Function} callback callback function receives the result of
   *                            response[responseKey] as its first argument.
   *
   * @return {Object} self.
   */
  _sendCommand: function(command, responseKey, callback) {
    if (!command.element) {
      command.element = this.id;
    }

    var isSync = this.client.isSync;
    var result =
      this.client._sendCommand(command, responseKey, callback);

    if (isSync)
      return result;

    return this;
  },

  /**
   * Finds a single child of this element.
   *
   * @method findElement
   * @param {String} query search string.
   * @param {String} method search method.
   * @param {Function} callback element callback.
   * @return {Object} self.
   */
  findElement: function findElement(query, method, callback) {
    var result = this.client.findElement(query, method, this.id, callback);

    if (this.client.isSync) {
      return result;
    }
    return this;
  },

  /**
   * Finds a all children of this element that match a pattern.
   *
   * @method findElements
   * @param {String} query search string.
   * @param {String} method search method.
   * @param {Function} callback element callback.
   * @return {Object} self.
   */
  findElements: function findElement(query, method, callback) {
    var result = this.client.findElements(query, method, this.id, callback);
    if (this.client.isSync) {
      return result;
    }
    return this;
  },

  /**
   * Shortcut method to execute
   * a function with this element as first argument.
   *
   *
   * @method scriptWith
   * @param {Function|String} script remote script.
   * @param {Function} callback callback when script completes.
   */
  scriptWith: function scriptWith(script, callback) {
    return this.client.executeScript(script, [this], callback);
  },

  /**
   * Checks to see if two elements are equal
   *
   * @method equals
   * @param {Marionette.Element} element element to test.
   * @return {Boolean} true when equal.
   */
  equals: function equals(element) {
    if (!(element instanceof Element)) {
      throw new Error('must pass an element');
    }

    return this.id === element.id;
  },

  /**
   * Gets attribute value for element.
   *
   * @method getAttribute
   * @param {String} attr attribtue name.
   * @param {Function} callback gets called with attribute's value.
   * @return {Object} self.
   */
  getAttribute: function getAttribute(attr, callback) {
    var cmd = {
      type: 'getElementAttribute',
      name: attr
    };

    return this._sendCommand(cmd, 'value', callback);
  },

  /**
   * Sends typing event keys to element.
   *
   *
   * @method sendKeys
   * @param {String|Array} input message to type.
   * @param {Function} callback boolean success.
   * @return {Object} self.
   */
  sendKeys: function sendKeys(input, callback) {
    if (!Array.isArray(input)) {
      input = [input];
    }
    var cmd = {
      type: 'sendKeysToElement',
      value: input
    };
    return this._sendCommand(cmd, 'ok', callback);
  },

  /**
   * Clicks element.
   *
   * @method click
   * @param {Function} callback boolean result.
   * @return {Object} self.
   */
  click: function click(callback) {
    var cmd = {
      type: 'clickElement'
    };
    return this._sendCommand(cmd, 'ok', callback);
  },

  /**
   * Gets text of element
   *
   * @method text
   * @param {Function} callback text of element.
   * @return {Object} self.
   */
  text: function text(callback) {
    var cmd = {
      type: 'getElementText'
    };
    return this._sendCommand(cmd, 'value', callback);
  },

  /**
   * Returns tag name of element.
   *
   * @method tagName
   * @param {Function} callback node style [err, tagName].
   */
  tagName: function tagName(callback) {
    var cmd = {
      type: 'getElementTagName'
    };
    return this._sendCommand(cmd, 'value', callback);
  },

  /**
   * Taps an element at given x and y coordinates.
   * If no offsets are given, it will be tapped at the center of the element.
   *
   * @method tap
   * @param {Number} [x] offset for the tap.
   * @param {Number} [y] offset for the tap.
   * @param {Function} [callback] [Error err]
   */
  tap: function(x, y, callback) {
    var cmd = {
      type: 'singleTap'
    };

    if (typeof(x) === 'number' &&
        typeof(y) === 'number') {
      cmd.x = x;
      cmd.y = y;
    }

    return this._sendCommand(cmd, 'value', callback);
  },

  /**
   * Clears element.
   *
   * @method clear
   * @param {Function} callback value of element.
   * @return {Object} self.
   */
  clear: function clear(callback) {
    var cmd = {
      type: 'clearElement'
    };
    return this._sendCommand(cmd, 'ok', callback);
  },

  /**
   * Checks if element is selected.
   *
   *
   * @method selected
   * @param {Function} callback boolean argument.
   * @return {Object} self.
   */
  selected: function selected(callback) {
    var cmd = {
      type: 'isElementSelected'
    };
    return this._sendCommand(cmd, 'value', callback);
  },

  /**
   * Checks if element is enabled.
   *
   * @method enabled
   * @param {Function} callback boolean argument.
   * @return {Object} self.
   */
  enabled: function enabled(callback) {
    var cmd = {
      type: 'isElementEnabled'
    };
    return this._sendCommand(cmd, 'value', callback);
  },

  /**
   * Checks if element is displayed.
   *
   *
   * @method displayed
   * @param {Function} callback boolean argument.
   * @return {Object} self.
   */
  displayed: function displayed(callback) {
    var cmd = {
      type: 'isElementDisplayed'
    };
    return this._sendCommand(cmd, 'value', callback);
  },

  /**
   * Returns the size of a given element.
   *
   * The returned size will be in the following format:
   *
   *    // returned in callback or result of this call in the sync driver.
   *    {
   *      x: Number,
   *      y: Number
   *    }
   *
   * @method size
   * @param {Function} callback [Error err, Object size].
   * @return {Object} self.
   */
  size: function size(callback) {
    var cmd = {
      type: 'getElementSize'
    };
    return this._sendCommand(cmd, 'value', callback);
  },

  /**
   * Returns the dictionary with x and y locatioin of an element.
   *
   * The returned location will be in the following format:
   *
   *    // returned in callback or result of this call in the sync driver.
   *    {
   *      x: Number,
   *      y: Number
   *    }
   *
   * @method location
   * @param {Function} callback [Error err, Object location].
   * @return {Object} self.
   */
  location: function location(callback) {
    var cmd = {
      type: 'getElementPosition'
    };
    return this._sendCommand(cmd, 'value', callback);
  }
};

module.exports = Element;
