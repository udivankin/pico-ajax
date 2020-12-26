import http from 'http';
import https from 'https';
import { URL } from 'url';
import zlib from 'zlib';

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
function composeAuthHeader(username, password) {
    return username && password
        ? { auth: `${username}:${password}` }
        : {};
}
/**
 * Server-only URL parser
 */
function parseUrl(requestUrl, baseUrl) {
    const { hostname, pathname, search, protocol, port, username, password } = new URL(requestUrl, baseUrl || undefined);
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
        response.on('end', async () => {
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
                    const response = await serverRequest(method, headers.location, originalOptions, redirectCount + 1);
                    resolve(response);
                }
                catch (e) {
                    reject(e);
                }
            }
            else {
                reject(new PicoAjaxResponseError(`${statusCode} ${statusMessage} Request Failed`, responseData));
            }
        });
    };
}
/**
 * Compose http request options
 */
function getServerRequestOptions(method, originalUrl, options) {
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
    };
}
/**
 * Make a request on nodejs
 */
function serverRequest(method, url, options, redirectCount = 0) {
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

export default picoAjax;
