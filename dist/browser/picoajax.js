var PicoAjax = (function () {
    'use strict';

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
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    /**
     * Default request options
     */
    var DEFAULT_OPTIONS = {
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
        var data;
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
    var PicoAjaxResponseError = /** @class */ (function (_super) {
        __extends(PicoAjaxResponseError, _super);
        function PicoAjaxResponseError(message, response) {
            var _this = _super.call(this, message) || this;
            _this.name = "ReponseError";
            if (response) {
                _this.statusCode = response.statusCode;
                _this.statusMessage = response.statusMessage;
                _this.headers = response.headers;
                _this.body = response.body;
            }
            return _this;
        }
        return PicoAjaxResponseError;
    }(Error));

    /**
     * Known HTTP request response types
     */
    var XHR_RESPONSE_TYPES = [
        'arraybuffer', 'blob', 'document', 'json', 'text',
    ];
    /**
     * Headers string parser
     */
    function parseHeaders(headersString) {
        return headersString.split(/[\r\n]+/).filter(Boolean).reduce(function (acc, h) {
            var header = h.split(':').map(function (s) { return (s || '').trim(); });
            if (header.length === 2) {
                acc[header[0]] = header[1];
            }
            return acc;
        }, {});
    }
    /**
     * Try to parse response
     */
    function handleBrowserResponse(xhr) {
        var headers = parseHeaders(xhr.getAllResponseHeaders());
        var body = XHR_RESPONSE_TYPES.indexOf(xhr.responseType) !== -1 ? xhr.response : parseJson(xhr.responseText);
        return {
            statusCode: xhr.status,
            statusMessage: xhr.statusText,
            headers: headers,
            body: body,
        };
    }
    /**
     * Make a request
     */
    function browserRequest(method, originalUrl, options) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            // Open XMLHttpRequest using given options
            xhr.open(method, originalUrl, options.async);
            // Override default timeout, responseType and withCredentials for XMLHttpRequest
            var onProgress = options.onProgress, responseType = options.responseType, timeout = options.timeout, withCredentials = options.withCredentials;
            if (responseType !== undefined) { // default option value is undefined
                xhr.responseType = options.responseType;
            }
            if (timeout !== undefined) { // default option value is undefined
                xhr.timeout = options.timeout;
            }
            if (options.username && options.password) {
                xhr.setRequestHeader('Authorization', "Basic " + btoa(options.username + ":" + options.password));
            }
            if (withCredentials !== undefined) { // default option value is undefined
                xhr.withCredentials = options.withCredentials;
            }
            // Set request headers one by one using XMLHttpRequest.setRequestHeader method
            Object.keys(options.headers).forEach(function (headerKey) {
                xhr.setRequestHeader(headerKey, options.headers[headerKey]);
            });
            xhr.send(options.body);
            // Bind onprogress callback
            if (typeof onProgress === 'function') {
                xhr.addEventListener('progress', onProgress.bind(xhr));
            }
            // Define onload callback
            xhr.addEventListener('load', function () {
                var response = handleBrowserResponse(xhr);
                if (xhr.status !== 200) {
                    reject(new PicoAjaxResponseError("[" + xhr.status + "] " + xhr.responseText, response));
                }
                else {
                    resolve(response);
                }
            });
        });
    }
    var picoAjax = {
        get: function (url, options) { return browserRequest('GET', url, merge(DEFAULT_OPTIONS, options)); },
        post: function (url, options) { return browserRequest('POST', url, merge(DEFAULT_OPTIONS, options)); },
        put: function (url, options) { return browserRequest('PUT', url, merge(DEFAULT_OPTIONS, options)); },
        delete: function (url, options) { return browserRequest('DELETE', url, merge(DEFAULT_OPTIONS, options)); },
        head: function (url, options) { return browserRequest('HEAD', url, merge(DEFAULT_OPTIONS, options)); },
        patch: function (url, options) { return browserRequest('PATCH', url, merge(DEFAULT_OPTIONS, options)); },
        connect: function (url, options) { return browserRequest('CONNECT', url, merge(DEFAULT_OPTIONS, options)); },
        options: function (url, options) { return browserRequest('OPTIONS', url, merge(DEFAULT_OPTIONS, options)); },
    };

    return picoAjax;

}());
