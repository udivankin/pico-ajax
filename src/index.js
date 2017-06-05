/**
 * Pico-ajax library main module
 *
 * @exports {Object} picoAjax
 */

const { parseJson, parseUrl } = require('./helpers');
const { browserRequest } = require('./browser');
const { serverRequest } = require('./server');

 /**
  * Known HTTP request methods
  */
const REQUEST_METHODS = [
  'CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT',
];

/**
 * Known HTTP request response types
 */
const XHR_RESPONSE_TYPES = [
 'arraybuffer', 'blob', 'document', 'json', 'text',
];

/**
 * Default request options
 */
const DEFAULT_OPTIONS = {
  async: true,
  body: undefined,
  headers: {},
  onprogress: null,
  password: undefined,
  responseType: '',
  timeout: 0,
  username: undefined,
};

/**
 * Universal request
 *
 * @param {string} method HTTP method
 * @param {string} url Url
 * @param {Object} [customOptions] request options
 * @returns {Promise}
 */
function request(method, url, customOptions = {}) {
  // Merge user definded request options with default ones
  const options = Object.assign(DEFAULT_OPTIONS, customOptions);

  return (typeof global !== 'undefined') && (typeof window === 'undefined')
    ? serverRequest(method, url, options)
    : browserRequest(method, url, options)
}

/**
 * Generate request methods
 */
const picoAjax = REQUEST_METHODS.reduce(
  (result, method) => {
    result[method.toLowerCase()] = (...args) => request(method, ...args);
    return result;
  },
  {}
);

module.exports = picoAjax;
