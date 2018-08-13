/**
 * Pico-ajax library heloers module
 *
 * @global JSON, URL
 * @exports {Object} picoAjax
 */

import http from 'http';
import https from 'https';
import { parse as nodeParseUrl, resolve as nodeResolveUrl } from 'url';
import zlib from 'zlib';

const MAX_REDIRECTS = 21;

/**
 * Try to parse json
 *
 * @param {string} json
 * @returns {Object}
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
 * @param {string} [baseUrl]
 * @returns {Object}
 */
export function parseUrl(requestUrl, baseUrl) {
  // Modern browsers and Node v7+
  if (typeof URL !== 'undefined') {
    return baseUrl ? new URL(requestUrl, baseUrl) : new URL(baseUrl);
  }
  // Node up to v6
  if (typeof global !== 'undefined') {
    return baseUrl
      ? nodeParseUrl(nodeResolveUrl(baseUrl, requestUrl))
      : nodeParseUrl(requestUrl);
  }

  return {};
}

/**
 * Decompress http response
 *
 * @param {http.ClientResponse} response Response stream
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
 * Request method getter
 *
 * @param {Object} requestOptions
 * @returns {function}
 */
export function getRequestMethod(requestOptions) {
  return /^https/.test(requestOptions.href) ? https.request : http.request;
}

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
export function followRedirects(originalRequestOptions, originalResponseHandler, redirectCount = 0) {
  const wrappedResponseHandler = (response) => {
    const { headers, statusCode, statusText } = response;

    // Follow redirects until we get non-redirect response code
    if (statusCode >= 300 && statusCode < 400) {
      if (redirectCount >= MAX_REDIRECTS) {
        response.statusText = 'Too many redirects';
        originalResponseHandler(response);
      } else {
        const requestOptions = Object.assign(
          originalRequestOptions,
          parseUrl(headers.location, `${originalRequestOptions.protocol}//${originalRequestOptions.host}`)
        );
        followRedirects(requestOptions, originalResponseHandler, redirectCount + 1).end();
      }

      return;
    }

    originalResponseHandler(response);
  }

  return new WrappedRequest(
    getRequestMethod(originalRequestOptions)(originalRequestOptions, wrappedResponseHandler)
  );
}
