/**
 * Pico-ajax library heloers module
 *
 * @global JSON, URL
 * @exports {Object} picoAjax
 */

import http from 'http';
import https from 'https';
import { parse as nodeParseUrl } from 'url';
import zlib from 'zlib';

/**
 * Try to parse json
 *
 * @param {*} json
 */
export function parseJson(json) {
  let data;

  try {
    data = JSON.parse(json);
  } catch (err) {
    data = json;
  }

  return data;
}

/**
 * Universal url parser
 *
 * @param {string} requestUrl
 * @returns {Object}
 */
export function parseUrl(requestUrl) {
  // Modern browsers and Node v7+
  if (typeof URL !== 'undefined') {
    return new URL(requestUrl);
  }
  // Node up to v6
  if (typeof global !== 'undefined') {
    return nodeParseUrl(requestUrl);
  }

  return {};
}

/**
 * Decompress http response
 *
 * @param {Stream} response Response stream
 * @param {Buffer} responseBuffer Response buffer
 * @returns {*} responseBuffer
 */
export function decompress(response, responseBuffer) {
  const contentEncoding = response.headers['content-encoding'];

  if (contentEncoding === 'gzip') {
    return zlib.gunzipSync(responseBuffer);
  }

  if (contentEncoding === 'deflate') {
    return zlib.deflateSync(responseBuffer);
  }

  return responseBuffer;
}

/**
 * Response wrapper for redirects
 */
class WrappedResponse {
  constructor(response) {
    this.response = response;
  }
  on(eventName, callback) {
    console.log('on', eventName, callback);

    if (eventName === 'data') {
      this.response.on(eventName, callback);
    }

    if (eventName === 'end') {
      this.headers = this.response.headers;
      this.statusCode = this.response.statusCode;
      this.statusText = this.response.statusText;
      this.response.on(eventName, callback);
    }
  };
};

/**
 * Request wrapper for redirects
 */
class WrappedRequest {
  constructor(request) {
    this.request = request;
  }
  on(...args) {
    return this.request.on(...args);
  }
  end(...args) {
    return this.request.end(...args);
  }
  write(...args) {
    return this.request.write(...args);
  }
}

/**
 * Follow redirect helper
 *
 * @param {Object} originalRequestOptions
 * @param {function} originalResponseHandler
 * @returns {Object}
 */
export function followRedirects(originalRequestOptions, originalResponseHandler) {
  const requestMethod = /^https/.test(originalRequestOptions.href) ? https.request : http.request;

  const wrappedResponseHandler = (response) => {
    originalResponseHandler(new WrappedResponse(response));
  }

  const request = requestMethod(originalRequestOptions, wrappedResponseHandler);

  return new WrappedRequest(request);
}
