import http from 'http';
import https from 'https';
import { URL } from 'url';
import zlib from 'zlib';

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
 * Default request headers
 */
const DEFAULT_HEADERS = {
  'Accept': '*/*',
  'Accept-encoding': 'gzip, deflate, identity',
  'User-Agent': 'pico-ajax',
};

/**
 * Maximum redirects count
 */
const MAX_REDIRECTS = 21;

/**
 * Decompress http response
 */
function decompress(
  response: http.IncomingMessage,
  responseBuffer: Buffer,
) {
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
 * Compose auth request header
 */
function composeAuthHeader(
  username: string, 
  password: string,
): Object {
  return username && password
    ? { auth: `${username}:${password}` }
    : {};
}

/**
 * Server-only URL parser
 */
function parseUrl(
  requestUrl: string, 
  baseUrl?: string,
) {
  const { 
    hostname, pathname, search, protocol, port, username, password
   } = new URL(requestUrl, baseUrl || undefined);

  return {
    hostname,
    path: pathname + search,
    protocol,
    ...port ? { port } : {},
    ...composeAuthHeader(username, password),
  };
}


/**
 * HTTP response body interpreter
 */
function handleServerResponse(
  response: http.IncomingMessage, 
  responseBuffer: Buffer,
) {
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
 */
function createServerResponseHandler(
  resolve: Function,
  reject: Function,
  method: string,
  originalOptions: PicoAjaxRequestOptions,
  redirectCount: number,
) {
  return (response: http.IncomingMessage) => {
    const { headers, statusCode, statusMessage } = response;
    const responseBuffer = [];

    response.on('data', (chunk) => {
      responseBuffer.push(chunk);
    });

    response.on('end', async () => {
      const body = handleServerResponse(response, Buffer.concat(responseBuffer));
      const responseData = { body, headers, statusCode, statusMessage };

      if (statusCode >= 200 && statusCode < 300) {
        resolve(responseData);
      } else if (statusCode >= 300 && statusCode < 400) {
        if (redirectCount > MAX_REDIRECTS) {
          responseData.statusCode = 310;
          responseData.statusMessage = 'Too many redirects';
          reject(new PicoAjaxResponseError(`${statusCode} ${statusMessage}`, responseData));
          return;
        }
        try {
          const response = await serverRequest(method, headers.location, originalOptions, redirectCount + 1);
          resolve(response);
        } catch(e) {
          reject(e);
        }
      } else {
        reject(new PicoAjaxResponseError(`${statusCode} ${statusMessage} Request Failed`, responseData));
      }
    });
  }
}

/**
 * Compose http request options
 */
function getServerRequestOptions(
  method: string,
  originalUrl: string,
  options: PicoAjaxRequestOptions,
): http.RequestOptions {
  return {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.body !== undefined ? { 'Content-Length': Buffer.byteLength(options.body) } : {},
      ...options.headers
    },
    timeout: options.timeout || 0,
    ...parseUrl(originalUrl),
    // auth derived from options is preferred over auth that came from URL
    ...composeAuthHeader(options.username, options.password),
  }
};

/**
 * Make a request on nodejs
 */
function serverRequest(
  method: string, 
  url: string,
  options: PicoAjaxRequestOptions,
  redirectCount = 0,
): Promise<PicoAjaxResponse> {
  return new Promise((resolve, reject) => {
    const requestOptions = getServerRequestOptions(method, url, options);
    const responseHandler = createServerResponseHandler(resolve, reject, method, options, redirectCount);
    const request = (requestOptions.protocol === 'https:' ? https : http).request(requestOptions, responseHandler);

    request.on('error', () => {
      reject(new PicoAjaxResponseError(`Request Failed`));
    });

    if (options.body !== undefined) {
      request.write(options.body);
    }

    request.end();
  });
};

const picoAjax: PicoAjax = {
  get: (url, options) => serverRequest('get', url, merge(DEFAULT_OPTIONS, options)),
  post: (url, options) => serverRequest('post', url, merge(DEFAULT_OPTIONS, options)),
  put: (url, options) => serverRequest('put', url, merge(DEFAULT_OPTIONS, options)),
  delete: (url, options) => serverRequest('delete', url, merge(DEFAULT_OPTIONS, options)),
  head: (url, options) => serverRequest('head', url, merge(DEFAULT_OPTIONS, options)),
  patch: (url, options) => serverRequest('patch', url, merge(DEFAULT_OPTIONS, options)),
  connect: (url, options) => serverRequest('connect', url, merge(DEFAULT_OPTIONS, options)),
  options: (url, options) => serverRequest('options', url, merge(DEFAULT_OPTIONS, options)),
  trace: (url, options) => serverRequest('trace', url, merge(DEFAULT_OPTIONS, options)),
}

export default picoAjax;