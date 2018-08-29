/**
 * Pico-ajax library main module
 */

 /**
  * @typedef {Object} RequestOptions
  * @property {boolean} async (Browser-specific)
  * @property {string} body
  * @property {Object} headers
  * @property {function} onprogress (Browser-specific)
  * @property {string} password
  * @property {string} responseType (Browser-specific)
  * @property {number} timeout
  * @property {string} username
  * @property {boolean} withCredentials (Browser-specific)
  */
 
 /**
  * @typedef {function} HttpRequest
  * @property {string} url
  * @property {RequestOptions} options
  */

 /**
  * @typedef {Object} PicoAjax
  * @property {HttpRequest} get
  * @property {HttpRequest} post
  * @property {HttpRequest} put
  * @property {HttpRequest} delete
  * @property {HttpRequest} head
  * @property {HttpRequest} patch
  * @property {HttpRequest} connect
  * @property {HttpRequest} options
  */

import { browserRequest } from './browser';
import { serverRequest } from './server';

/**
 * Known HTTP request methods
 */
const REQUEST_METHODS = [
  'CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT',
];

/**
 * Default request options
 * 
 * @type {RequestOptions}
 */
const DEFAULT_OPTIONS = {
  async: true,
  body: undefined,
  headers: {},
  onprogress: null,
  password: undefined,
  responseType: '',
  timeout: undefined,
  username: undefined,
  withCredentials: undefined,
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
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  return (typeof global !== 'undefined') && (typeof window === 'undefined')
    ? serverRequest(method, url, options)
    : browserRequest(method, url, options)
}

/**
 * Generate request methods
 */
const picoAjax = REQUEST_METHODS.reduce(
  (result, method) => {
    result[method.toLowerCase()] = (url, options) => request(method, url, options);
    return result;
  },
  {}
);

export default picoAjax;
