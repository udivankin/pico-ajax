const fs = require('fs');
const http = require('http');
const path = require('path');
const PicoAjax = require('../dist/cjs/picoajax.js');

function isEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = object1[key];
    const val2 = object2[key];
    const areObjects = isObject(val1) && isObject(val2);
    if (
      (areObjects && !isEqual(val1, val2)) ||
      (!areObjects && val1 !== val2)
    ) {
      return false;
    }
  }

  return true;
}

const PUBLIC_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'];
const PORT = 8123;
const TEST_CASES = require('./test.json');

function log(glyph = '', text = '', method = '', url = '', ...data) {
  const suffix = data.length > 0 ? `\n${JSON.stringify(data)}` : '';
  console.log(`${glyph} ${text} | ${method.toUpperCase()} ${url}${suffix}`);
}

function handleRequest(request, response) {
  let body = [];
  request.on('data', chunk => body.push(chunk));
  request.on('end', () => {
    body = Buffer.from(body);
    const { method, url } = request;

    if (url === '/') {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.write(fs.readFileSync(__dirname + '/test.html'));
      response.end();
      return;
    }

    if (url === '/picoajax.js') {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.write(fs.readFileSync(__dirname + '/../dist/browser/picoajax.js'));
      response.end();
      return;
    }

    if (url === '/test.json') {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.write(JSON.stringify(TEST_CASES));
      response.end();
      return;
    }

    const test = TEST_CASES[request.url];
    
    if (!test) {
      response.statusCode = 404;
      response.end();
      return;
    }

    const testBody = Buffer.from(test.requestBody || '');

    // validate request body
    if (test.requestBody) {
      if (!Buffer.compare(body, testBody)) {
        log('❌', 'Request body mismatch', method, url, testBody.toString(), '!==', body.toString());
      } else {
        log('✅', 'Request body code OK',  method, url, testBody);
      }
    }

    // validate request headers
    if (test.requestHeaders) {
      for (const h of Object.keys(test.requestHeaders)) {
        if (request.headers?.[h] !== test.requestHeaders[h]) {
          log('❌', 'Request header mismatch', method, url, h, test.requestHeaders[h], '!==', request.headers?.[h]);
        }  else {
          log('✅', 'Request header OK', method, url, h);
        }
      }
    }
    
    // validate auth
    if (test.username) {
      try {
        const authHeader = request.headers?.authorization.split(' ')[1];
        const decodedAuthToken = Buffer.from(authHeader, 'base64').toString();
        const [username, password] = decodedAuthToken.split(':');
        if (username !== test.username) throw new Error('wrong username');
        if (password !== test.password) throw new Error('wrong password'); 
      } catch (e) {
        log('❌', 'Request basic auth error:', e.message, method, url, request.headers)
      }
    }

    // set response code
    response.statusCode = test.responseCode;

    // set response headers
    if (test.responseHeaders) {
      for (const h of Object.keys(test.responseHeaders)) {
        response.setHeader(h, test.responseHeaders[h]);
      }
    }

    // set response body
    if (test.responseBody) {
      response.write(test.responseBody);
    }
    
    response.end();
  });
}

const server = http.createServer(handleRequest);

function validateResponseBody(method, test, response) {
  if (!response.body.toString() && !test.responseBody) return true;
  if (method === 'head') return true;
  return response.body?.toString() === test.responseBody?.toString();
}

function validateResponseHeaders(method, test, response) {
  if (!test.responseHeaders) return true;
  for (const h of Object.keys(test.responseHeaders)) {
    if (response.headers?.[h] !== test.responseHeaders[h]) return false;
  }
  return true;
}

async function startTest() {
  for (const testCase of Object.keys(TEST_CASES)) {
    let test = TEST_CASES[testCase];
    if (test.disabled) continue;

    for (const method of PUBLIC_METHODS) {
      try {
        let requestOptions = {};

        if (test.requestHeaders) {
          requestOptions.headers = test.requestHeaders;
        }

        if (test.requestBody) {
          requestOptions.body = test.requestBody;
        }

        if (test.username) {
          requestOptions.username = test.username;
        }

        if (test.password) {
          requestOptions.password = test.password;
        }

        let response;

        try {
          response = (await PicoAjax[method](`http://localhost:${PORT}${testCase}`, requestOptions));
        } catch(e) {
          response = e;
        }

        // Mutate current expected test data
        if (test.expectRedirect) {
          test = TEST_CASES[test.expectRedirect];
        }

        if (response.statusCode !== test.responseCode) {
          log('❌', 'Response code mismatch', method, testCase, test.responseCode, '!==', response.statusCode);
        } else {
          log('✅', 'Response code OK', method, testCase);
        }

        if (!validateResponseBody(method, test, response)) {
          log('❌', 'Response body mismatch', method, testCase, test.responseBody, '!==', response.body);
        } else {
          log('✅', 'Response body OK', method, testCase);
        }

        if (!validateResponseHeaders(method, test, response)) {
          log('❌', 'Response headers mismatch', method, testCase, test.responseHeaders, '!==', response.headers);
        } else {
          log('✅', 'Response headers OK', method, testCase);
        }

      } catch(e) {
        console.error(e);
      }
    }
  }
}

server.listen(PORT, startTest);