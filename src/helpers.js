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
 * Follow redirect helper
 *
 * @param {string} requestUrl
 * @returns {Object}
 */
export function followRedirects(requestOptions, responseHandler) {
    console.log(requestOptions);
    const requestMethod = /^https/.test(requestOptions.href) ? https.request : http.request;

    // TODO
    return requestMethod(requestOptions, responseHandler);
}
