/**
 * Pico-ajax library main module
 *
 * @global Promise, JSON, XMLHttpRequest, Error, Object
 * @exports {Object} picoAjax
 */

 /**
  * Known HTTP request methods
  */
const REQUEST_METHODS = [
  'CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT',
];

/**
 * Known HTTP request response types
 */
const RESPONSE_TYPES = [
 'arraybuffer', 'blob', 'document', 'json', 'text',
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
};

/**
 * Universal url parser
 *
 * @param {string} url
 * @returns {Object}
 */
function parseUrl(url) {
  // Modern browsers and Node v7+
  if (typeof URL !== 'undefined') {
    return new URL(url);
  }
  // Node up to v6
  if (typeof global !== 'undefined') {
    return require('url').parse(url);
  }

  return {};
}

/**
 * Try to parse json
 * 
 * @param {*} json 
 */
function parseJson(json) {
  let data;

  try {
    data = JSON.parse(json);
  } catch (err) {
    data = json;
  }

  return data;
}

/**
 * Try to parse response
 *
 * @param {Object} xhr Xhr request object
 * @returns {string|Object}
 */
function handleBrowserResponse(xhr) {
  // Return response as-is for know response types
  if (RESPONSE_TYPES.indexOf(xhr.responseType) !== -1) {
    return xhr.response;
  }

  return parseJson(xhr.responseText);
}

/**
 * Make a request
 *
 * @param {string} url Url
 * @param {Object} options request options
 * @returns {Promise}
 */
function browserRequest(method, originalUrl, options) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Open XMLHttpRequest using given options
    xhr.open(method, originalUrl, options.async, options.username, options.password);

    // Override default timeout and responseType for XMLHttpRequest
    xhr.responseType = options.responseType;
    xhr.timeout = options.timeout;

    // Set request headers one by one using XMLHttpRequest.setRequestHeader method
    Object.keys(options.headers).forEach(headerKey => {
      xhr.setRequestHeader(headerKey, options.headers[headerKey]);
    });

    xhr.send(options.body);

    // Bind onprogress callback
    xhr.onprogress = typeof options.onprogress === 'function'
      ? options.onprogress
      : null;

    // Define onload callback
    xhr.onload = () => {
      if (xhr.status !== 200) {
        reject(new Error(`[${xhr.status}]`, xhr.response, xhr.statusText));
      } else {
        resolve(handleBrowserResponse(xhr));
      }
    };
  });
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
    return parseJson(responseBuffer.toString('utf8'));
  }

  if (contentType && /text\//.test(contentType)) {
    return responseBuffer.toString('utf8');
  }

  return responseBuffer;
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
      resolve(handleServerResponse(response, Buffer.concat(responseBuffer)));
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
        options.headers,
        options.body !== undefined ? { 'Content-Length': Buffer.byteLength(options.body) } : {}
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
    const requestMethod = /^https/.test(url) ? require('https').request : require('http').request;

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

module.exports = picoAjax;
