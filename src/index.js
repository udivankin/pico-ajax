/**
 * Pico-ajax library main module
 *
 * @global Promise, JSON, XMLHttpRequest, Error, Object
 * @exports {Object} picoAjax
 */

 /**
  * Http request methods
  */
export const requestMethods = [
  'CONNECT',
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT',
  'TRACE',
];

/**
 * Default request options
 */
export const defaultOptions = {
  body: undefined,
  headers: {},
  password: undefined,
  responseType: 'json',
  user: undefined,
};

/**
 * Try to parse response
 *
 * @param {Object} xhr Xhr request object
 * @returns {string|Object}
 */
const getParsedResponse = (xhr) => {
  switch (xhr.responseType) {
    // these response types do not require any processing
    case 'arraybuffer':
    case 'blob':
    case 'document':
    case 'text':
    // we expect that 'json' responseType is already parsed as well
    case 'json':
      return xhr.response;
    default: {
      let data;

      try {
        data = JSON.parse(xhr.responseText);
      } catch (err) {
        data = xhr.responseText;
      }

      return data;
    }
  }
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
    const options = { ...defaultOptions, ...customOptions };
    const xhr = new XMLHttpRequest();

    xhr.open(method, url, true, options.user, options.password);

    // Override default responseType for XMLHttpRequest if defined
    if (options.responseType) {
      xhr.responseType = options.responseType;
    }

    // Set request headers one by one using XMLHttpRequest.setRequestHeader method
    Object.keys(options.headers).forEach(headerKey => {
      xhr.setRequestHeader(headerKey, options.headers[headerKey]);
    });

    xhr.send(options.body);

    // Define readystatechange callback
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) {
        return;
      }

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
const picoAjax = requestMethods.reduce(
  (result, method) => ({
    ...result,
    [method.toLowerCase()]: (...args) => request(method, ...args),
  }), {}
);

export default picoAjax;
