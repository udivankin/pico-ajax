/**
 * Pico-ajax library browser adapter
 *
 * @global Promise, JSON, XMLHttpRequest, Error, Object
 * @exports {Object}
 */

const { parseJson } = require('./helpers');

/**
 * Try to parse response
 *
 * @param {Object} xhr Xhr request object
 * @returns {string|Object}
 */
function handleBrowserResponse(xhr) {
  // Return response as-is for know response types
  if (XHR_RESPONSE_TYPES.indexOf(xhr.responseType) !== -1) {
    return xhr.response;
  }

  return parseJson(xhr.responseText);
}

/**
 * Make a request
 *
 * @param {string} url Url
 * @param {Object} options request options
 * @returns {Promise}
 */
function browserRequest(method, originalUrl, options) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Open XMLHttpRequest using given options
    xhr.open(method, originalUrl, options.async, options.username, options.password);

    // Override default timeout and responseType for XMLHttpRequest
    xhr.responseType = options.responseType;
    xhr.timeout = options.timeout;

    // Set request headers one by one using XMLHttpRequest.setRequestHeader method
    Object.keys(options.headers).forEach(headerKey => {
      xhr.setRequestHeader(headerKey, options.headers[headerKey]);
    });

    xhr.send(options.body);

    // Bind onprogress callback
    xhr.onprogress = typeof options.onprogress === 'function'
      ? options.onprogress
      : null;

    // Define onload callback
    xhr.onload = () => {
      if (xhr.status !== 200) {
        reject(new Error(`[${xhr.status}]`, xhr.response, xhr.statusText));
      } else {
        resolve(handleBrowserResponse(xhr));
      }
    };
  });
}

module.exports = { browserRequest };