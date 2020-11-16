import { isPlainObject } from 'lodash';
import PicoAjax from 'pico-ajax';
import qs from 'qs';

/**
 * Global ajax requests onprogress handler
 *
 * @param {Object} event
 */
const coolProgressBarHandler = (event) => {
  console.log(event);
};

/**
 * Global API error handler
 *
 * @param {Error} error
 */
const defaultErrorHandler = (error) => {
  console.error(error);
  throw error; // Enable to catch it further
};

/**
 * Default request options for all requests
 *
 * @type {Object}
 */
const defaultRequestOptions = {
  responseType: 'json',                 // Assuming we work with JSON-based API
  onprogress: coolProgressBarHandler,
};

/**
 * Default request URL prefix
 */
const API_URL = 'https://example.com';

/**
 * Request method wrapper
 *
 * @param {string} requestMethod
 * @param {string} requestUrl
 * @param {*} requestParams
 * @returns {Promise}
 */
const picoAjaxWrapper = (requestMethod, requestUrl, requestParams) => {
  if (requestMethod === 'get') {
    return PicoAjax.get(
      `${API_URL}${requestUrl}?${qs.stringify(requestParams)}`,
      defaultRequestOptions,
    );
  }

  if (requestMethod === 'post') {
    let body;

    if (isPlainObject(requestParams)) {
      body = new FormData();

      Object.keys(requestParams).forEach(key => {
        body.append(key, requestParams[key]);
      });
    } else {
      body = requestParams;
    }

    return PicoAjax.post(
      url,
      {
        ...defaultRequestOptions,
        body,
      },
    )
  }

  return PicoAjax[requestMethod](requestUrl, requestParams);
};

// Generate our pretty near-perfect API module methods
const Api = Object.keys(PicoAjax).reduce((result, method) => ({
  ...result,
  [method]: (url, params) => picoAjaxWrapper(method, url, params).catch(defaultErrorHandler),
}), {});

export default Api;
