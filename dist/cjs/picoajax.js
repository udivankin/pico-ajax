'use strict';

var http = require('http');
var https = require('https');
var url = require('url');
var zlib = require('zlib');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
var https__default = /*#__PURE__*/_interopDefaultLegacy(https);
var zlib__default = /*#__PURE__*/_interopDefaultLegacy(zlib);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

/**
 * Default request options
 */
const DEFAULT_OPTIONS = {
    body: undefined,
    headers: {},
    username: undefined,
    password: undefined,
    timeout: undefined,
    async: true,
    onProgress: null,
    responseType: '',
    withCredentials: undefined,
};
/**
 * Try to parse json
 */
function parseJson(json) {
    let data;
    try {
        data = JSON.parse(json);
    }
    catch (err) {
        data = json;
    }
    return data;
}
function merge(obj1, obj2) {
    return Object.assign({}, obj1, obj2);
}
class PicoAjaxResponseError extends Error {
    constructor(message, response) {
        super(message);
        this.name = "ReponseError";
        if (response) {
            this.statusCode = response.statusCode;
            this.statusMessage = response.statusMessage;
            this.headers = response.headers;
            this.body = response.body;
        }
    }
}

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
function decompress(response, responseBuffer) {
    const contentEncoding = response.headers['content-encoding'];
    if (contentEncoding === 'gzip') {
        return zlib__default['default'].gunzipSync(responseBuffer);
    }
    if (contentEncoding === 'deflate') {
        return zlib__default['default'].deflateSync(responseBuffer);
    }
    return responseBuffer;
}
/**
 * Compose auth request header
 */
function composeAuthHeader(username, password) {
    return username && password
        ? { auth: `${username}:${password}` }
        : {};
}
/**
 * Server-only URL parser
 */
function parseUrl(requestUrl, baseUrl) {
    const { hostname, pathname, search, protocol, port, username, password } = new url.URL(requestUrl, baseUrl || undefined);
    return Object.assign(Object.assign({ hostname, path: pathname + search, protocol }, port ? { port } : {}), composeAuthHeader(username, password));
}
/**
 * HTTP response body interpreter
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
 */
function createServerResponseHandler(resolve, reject, method, originalOptions, redirectCount) {
    return (response) => {
        const { headers, statusCode, statusMessage } = response;
        const responseBuffer = [];
        response.on('data', (chunk) => {
            responseBuffer.push(chunk);
        });
        response.on('end', () => __awaiter(this, void 0, void 0, function* () {
            const body = handleServerResponse(response, Buffer.concat(responseBuffer));
            const responseData = { body, headers, statusCode, statusMessage };
            if (statusCode >= 200 && statusCode < 300) {
                resolve(responseData);
            }
            else if (statusCode >= 300 && statusCode < 400) {
                if (redirectCount > MAX_REDIRECTS) {
                    responseData.statusCode = 310;
                    responseData.statusMessage = 'Too many redirects';
                    reject(new PicoAjaxResponseError(`${statusCode} ${statusMessage}`, responseData));
                    return;
                }
                try {
                    const response = yield serverRequest(method, headers.location, originalOptions, redirectCount + 1);
                    resolve(response);
                }
                catch (e) {
                    reject(e);
                }
            }
            else {
                reject(new PicoAjaxResponseError(`${statusCode} ${statusMessage} Request Failed`, responseData));
            }
        }));
    };
}
/**
 * Compose http request options
 */
function getServerRequestOptions(method, originalUrl, options) {
    return Object.assign(Object.assign({ method, headers: Object.assign(Object.assign(Object.assign({}, DEFAULT_HEADERS), options.body !== undefined ? { 'Content-Length': Buffer.byteLength(options.body) } : {}), options.headers), timeout: options.timeout || 0 }, parseUrl(originalUrl)), composeAuthHeader(options.username, options.password));
}
/**
 * Make a request on nodejs
 */
function serverRequest(method, url, options, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        const requestOptions = getServerRequestOptions(method, url, options);
        const responseHandler = createServerResponseHandler(resolve, reject, method, options, redirectCount);
        const request = (requestOptions.protocol === 'https:' ? https__default['default'] : http__default['default']).request(requestOptions, responseHandler);
        request.on('error', () => {
            reject(new PicoAjaxResponseError(`Request Failed`));
        });
        if (options.body !== undefined) {
            request.write(options.body);
        }
        request.end();
    });
}
const picoAjax = {
    get: (url, options) => serverRequest('get', url, merge(DEFAULT_OPTIONS, options)),
    post: (url, options) => serverRequest('post', url, merge(DEFAULT_OPTIONS, options)),
    put: (url, options) => serverRequest('put', url, merge(DEFAULT_OPTIONS, options)),
    delete: (url, options) => serverRequest('delete', url, merge(DEFAULT_OPTIONS, options)),
    head: (url, options) => serverRequest('head', url, merge(DEFAULT_OPTIONS, options)),
    patch: (url, options) => serverRequest('patch', url, merge(DEFAULT_OPTIONS, options)),
    connect: (url, options) => serverRequest('connect', url, merge(DEFAULT_OPTIONS, options)),
    options: (url, options) => serverRequest('options', url, merge(DEFAULT_OPTIONS, options)),
    trace: (url, options) => serverRequest('trace', url, merge(DEFAULT_OPTIONS, options)),
};

module.exports = picoAjax;
