/**
 * Pico-ajax library heloers module
 *
 * @global URL
 * @exports {Object} picoAjax
 */

const url = require('url');

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
 * Universal url parser
 *
 * @param {string} requestUrl
 * @returns {Object}
 */
function parseUrl(requestUrl) {
  // Modern browsers and Node v7+
  if (typeof URL !== 'undefined') {
    return new URL(requestUrl);
  }
  // Node up to v6
  if (typeof global !== 'undefined') {
    return url.parse(requestUrl);
  }

  return {};
}

module.exports = { parseJson, parseUrl };