/**
 * Pico-ajax library main module
 */

 /**
  * @typedef {Object} PicoAjaxRequestOptions
  * @property {string} [body]
  * @property {Object} [headers]
  * @property {string} [username]
  * @property {string} [password]
  * @property {number} [timeout]
  * @property {boolean} [async] (Browser-specific)
  * @property {function} [onProgress] (Browser-specific)
  * @property {XMLHttpRequestResponseType} [responseType] (Browser-specific)
  * @property {boolean} [withCredentials] (Browser-specific)
  */
 
 /**
  * @typedef {function} HttpRequest
  * @property {string} url
  * @property {PicoAjaxRequestOptions} [options]
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
 * @type {PicoAjaxRequestOptions}
 */
const DEFAULT_OPTIONS = {
  body: undefined,
  headers: {},
  username: undefined,
  password: undefined,
  timeout: undefined,
  async: true,
  onProgress: null,
  responseType: '',
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
