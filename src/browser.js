/**
 * Pico-ajax library browser adapter
 */

import { parseJson } from './helpers';

/**
 * @typedef {import('./index').PicoAjaxRequestOptions} PicoAjaxRequestOptions
 */

/**
 * Known HTTP request response types
 */
const XHR_RESPONSE_TYPES = [
 'arraybuffer', 'blob', 'document', 'json', 'text',
];

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
 * @param {string} method HTTP Method
 * @param {PicoAjaxRequestOptions} options request options
 * @returns {Promise}
 */
export function browserRequest(method, originalUrl, options) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Open XMLHttpRequest using given options
    xhr.open(method, originalUrl, options.async, options.username, options.password);

    // Override default timeout, responseType and withCredentials for XMLHttpRequest
    const { onProgress, responseType, timeout, withCredentials } = options;

    if (responseType !== undefined) { // default option value is undefined
      xhr.responseType = options.responseType;
    }

    if (timeout !== undefined) { // default option value is undefined
      xhr.timeout = options.timeout;
    }

    if (withCredentials !== undefined) { // default option value is undefined
      xhr.withCredentials = options.withCredentials;
    }

    // Set request headers one by one using XMLHttpRequest.setRequestHeader method
    Object.keys(options.headers).forEach(headerKey => {
      xhr.setRequestHeader(headerKey, options.headers[headerKey]);
    });

    xhr.send(options.body);

    // Bind onprogress callback
    if (typeof onProgress === 'function') {
      xhr.addEventListener('progress', onProgress.bind(xhr));
    }

    // Define onload callback
    xhr.addEventListener('load', () => {
      if (xhr.status !== 200) {
        reject(new Error(`[${xhr.status}] ${xhr.statusText} ${xhr.response}`));
      } else {
        resolve(handleBrowserResponse(xhr));
      }
    });
  });
}
