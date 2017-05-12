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
  user: undefined,
};

/**
 * Try to parse response
 *
 * @param {Object} xhr Xhr request object
 * @returns {string|Object}
 */
const getParsedResponse = (xhr) => {
  // Return response as-is for know response types
  if (RESPONSE_TYPES.indexOf(xhr.responseType) !== -1) {
    return xhr.response;
  }

  let data;
  // Try to parse JSON response if responseType was not set
  try {
    data = JSON.parse(xhr.responseText);
  } catch (err) {
    data = xhr.responseText;
  }

  return data;
};

/**
 * Make a request
 *
 * @param {string} url Url
 * @param {Object} options request options
 * @returns {Promise}
 */
function request(method, url, customOptions = {}) {
  return new Promise((resolve, reject) => {
    // Merge user definded request options with default ones
    const options = { ...DEFAULT_OPTIONS, ...customOptions };
    const xhr = new XMLHttpRequest();

    // Open XMLHttpRequest using given options
    xhr.open(method, url, options.async, options.user, options.password);

    // Override default responseType for XMLHttpRequest
    xhr.responseType = options.responseType;

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
        resolve(getParsedResponse(xhr));
      }
    };
  });
}

/**
 * Generate request methods
 */
const picoAjax = REQUEST_METHODS.reduce(
  (result, method) => ({
    ...result,
    [method.toLowerCase()]: (...args) => request(method, ...args),
  }), {}
);

export default picoAjax;
