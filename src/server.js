/**
 * Pico-ajax library server adapter
 *
 * @exports {Object}
 */

const http = require('http');
const https = require('https');
const zlib = require('zlib');

const { parseJson, parseUrl } = require('./helpers');

function decompress(response, responseBuffer) {
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
 * HTTP response body interpreter
 *
 * @param {Stream} response Response stream
 * @param {Buffer} responseBuffer Response buffer
 * @returns {*} Response 
 */
function handleServerResponse(response, responseBuffer) {
  const contentType = response.headers['content-type'];

  if (contentType && /\/json/.test(contentType)) {
    return parseJson(decompress(response, responseBuffer).toString('utf8'));
  }

  if (contentType && /text\//.test(contentType)) {
    return decompress(response, responseBuffer).toString('utf8');
  }

  return decompress(response, responseBuffer);
}

/**
 * HTTP response handler creator
 *
 * @param {function} resolve Promise.resolve method
 * @param {function} resolve Promise.reject method
 * @returns {function} Response handeler
 */
function createServerResponseHandler(resolve, reject) {
  return (response) => {
    const responseBuffer = [];

    response.on('data', (chunk) => {
        responseBuffer.push(chunk);
    });

    response.on('end', () => {
      const { statusCode, statusText } = response;
      // Resolve on ok
      if (statusCode >= 200 && statusCode < 300) {
        return resolve(handleServerResponse(response, responseBuffer));
      }
      // Follow redirects
      if (statusCode >= 300 && statusCode < 400) {
        // TODO follow redirects
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
const getServerRequestOptions = (method, originalUrl, options) => (
  Object.assign(
    {
      method,
      headers: Object.assign(
        {
          'Accept': '*/*',
          'Accept-encoding': 'gzip, deflate, identity',
          'User-Agent': 'pico-ajax',
        },
        options.body !== undefined ? { 'Content-Length': Buffer.byteLength(options.body) } : {},
        options.headers
      ),
      timeout: options.timeout,
    },
    parseUrl(originalUrl),
    options.username && options.password
      ? { auth: `${options.username}:${options.password}`}
      : {}
  )
);

/**  
 * Make a request on nodejs
 *
 * @param {string} method HTTP method
 * @param {string} url Url
 * @param {Object} options request options
 * @returns {Promise}
 */
function serverRequest(method, url, options) {
  return new Promise((resolve, reject) => {
    const requestMethod = /^https/.test(url) ? https.request : http.request;

    const request = requestMethod(
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

module.exports = { serverRequest };