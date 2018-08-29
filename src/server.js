/**
 * Pico-ajax library server adapter
 */

import { composeAuthHeader, decompress, followRedirects, parseJson, parseUrl } from './helpers';

/**
 * Default request headers
 */
const DEFAULT_HEADERS = {
  'Accept': '*/*',
  'Accept-encoding': 'gzip, deflate, identity',
  'User-Agent': 'pico-ajax',
};

/**
 * HTTP response body interpreter
 *
 * @param {ClientResponse} response Response object
 * @param {Buffer} responseBuffer Response buffer
 * @returns {*} Response
 */
function handleServerResponse(response, responseBuffer) {
  const contentType = response.headers['content-type'];
  const decompressedResponse = decompress(response, responseBuffer);

  if (contentType && /\/json/.test(contentType)) {
    return parseJson(decompressedResponse.toString('utf8'));
  }

  if (contentType && /text\//.test(contentType)) {
    return decompressedResponse.toString('utf8');
  }

  return decompressedResponse;
}

/**
 * HTTP response handler creator
 *
 * @param {function} resolve Promise.resolve method
 * @param {function} reject Promise.reject method
 * @returns {function} Response handeler
 */
function createServerResponseHandler(resolve, reject) {
  return (response) => {
    const responseBuffer = [];

    response.on('data', (chunk) => {
        responseBuffer.push(chunk);
    });

    response.on('end', () => {
      const { headers, statusCode, statusText } = response;
      // Resolve on ok
      if (statusCode >= 200 && statusCode < 300) {
        return resolve(handleServerResponse(response, Buffer.concat(responseBuffer)));
      }
      // Reject on error
      reject(new Error(`${statusCode} ${statusText}`));
    });
  }
}

/**
 * Make a request on nodejs
 *
 * @param {string} method HTTP method
 * @param {string} originalUrl Url
 * @param {Object} options request options
 * @returns {Promise}
 */
const getServerRequestOptions = (method, originalUrl, options) => ({
  method,
  headers: {
    ...DEFAULT_HEADERS,
    ...options.body !== undefined ? { 'Content-Length': Buffer.byteLength(options.body) } : {},
    ...options.headers
  },
  timeout: options.timeout || 0,
  ...parseUrl(originalUrl),
  ...composeAuthHeader(options.username, options.password), // auth derived from options is preferred over auth that came from URL
});

/**
 * Make a request on nodejs
 *
 * @param {string} method HTTP method
 * @param {string} url Url
 * @param {Object} options request options
 * @returns {Promise}
 */
export function serverRequest(method, url, options) {
  return new Promise((resolve, reject) => {
    const request = followRedirects(
      getServerRequestOptions(method, url, options),
      createServerResponseHandler(resolve, reject)
    );

    request.on('error', (error) => {
      reject(error);
    });

    if (options.body !== undefined) {
      request.write(options.body);
    }

    request.end();
  });
}
