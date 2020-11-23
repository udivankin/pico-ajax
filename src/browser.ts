import {
  DEFAULT_OPTIONS,
  merge,
  parseJson,
  PicoAjaxResponseError,
} from './helpers';

import {
  PicoAjax,
  PicoAjaxRequestOptions,
  PicoAjaxResponse,
} from './index';

/**
 * Known HTTP request response types
 */
const XHR_RESPONSE_TYPES = [
 'arraybuffer', 'blob', 'document', 'json', 'text',
];

/**
 * Headers string parser
 */
function parseHeaders(headersString: string) {
  return headersString.split(/[\r\n]+/).filter(Boolean).reduce((acc, h) => {
    const header = h.split(':').map(s => (s||'').trim());
    acc[header[0]] = header[1];
    return acc;
  }, {});
}

/**
 * Try to parse response
 */
function handleBrowserResponse(xhr: XMLHttpRequest): PicoAjaxResponse {
  const headers = parseHeaders(xhr.getAllResponseHeaders());
  const body = XHR_RESPONSE_TYPES.indexOf(xhr.responseType) !== -1 ? xhr.response : parseJson(xhr.responseText);

  return  {
    statusCode: xhr.status,
    statusMessage: xhr.statusText,
    headers,
    body,
  };
}

/**
 * Make a request
 */
function browserRequest(method: string, originalUrl: string, options: PicoAjaxRequestOptions): Promise<PicoAjaxResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Open XMLHttpRequest using given options
    xhr.open(method, originalUrl, options.async);

    // Override default timeout, responseType and withCredentials for XMLHttpRequest
    const { onProgress, responseType, timeout, withCredentials } = options;

    if (responseType !== undefined) { // default option value is undefined
      xhr.responseType = options.responseType;
    }

    if (timeout !== undefined) { // default option value is undefined
      xhr.timeout = options.timeout;
    }

    if (options.username && options.password) {
      xhr.setRequestHeader('Authorization', `Basic ${btoa(`${options.username}:${options.password}`)}`); 
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
      const response = handleBrowserResponse(xhr);
      if (xhr.status !== 200) {
        reject(new PicoAjaxResponseError(`[${xhr.status}] ${xhr.responseText}`, response));
      } else {
        resolve(response);
      }
    });
  });
}

const picoAjax: PicoAjax = {
  get: (url, options) => browserRequest('GET', url, merge(DEFAULT_OPTIONS, options)),
  post: (url, options) => browserRequest('POST', url, merge(DEFAULT_OPTIONS, options)),
  put: (url, options) => browserRequest('PUT', url, merge(DEFAULT_OPTIONS, options)),
  delete: (url, options) => browserRequest('DELETE', url, merge(DEFAULT_OPTIONS, options)),
  head: (url, options) => browserRequest('HEAD', url, merge(DEFAULT_OPTIONS, options)),
  patch: (url, options) => browserRequest('PATCH', url, merge(DEFAULT_OPTIONS, options)),
  connect: (url, options) => browserRequest('CONNECT', url, merge(DEFAULT_OPTIONS, options)),
  options: (url, options) => browserRequest('OPTIONS', url, merge(DEFAULT_OPTIONS, options)),
}

export default picoAjax;