/**
 * Pico-ajax library helpers
 */

import http from 'http';
import https from 'https';
import zlib from 'zlib';

const MAX_REDIRECTS = 21;

/**
 * Compose auth request header
 *
 * @param {string} [username]
 * @param {string} [password]
 * @returns {Object}
 */
export function composeAuthHeader(username, password) {
  return username && password
    ? { auth: `${username}:${password}` }
    : {};
}

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
  const { hostname, pathname, search, protocol, port, username, password } = baseUrl
    ? new URL(requestUrl, baseUrl)
    : new URL(requestUrl);

  return {
    hostname,
    path: pathname + search,
    protocol,
    ...port ? { port } : {},
    ...composeAuthHeader(username, password),
  };
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
  return requestOptions.protocol === 'https:' ? https.request : http.request;
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
        const requestOptions = {
          ...originalRequestOptions,
          ...parseUrl(headers.location, `${originalRequestOptions.protocol}//${originalRequestOptions.host}`)
        };
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
