/**
 * Pico-ajax library main module
 *
 * @global Object
 * @exports {Object} picoAjax
 */

import { parseJson, parseUrl } from './helpers';
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

export default picoAjax;
