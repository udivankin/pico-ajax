const { get, post } = require('../../src/index.js');

const host = 'https://httpbin.org';

// Perform simple get request
get(`${host}/get?foo=bar`)
  .then(result => {
    console.log('GET request response: ', result);
  })
  .catch(error => {
    console.error(error);
  });

// Perform post request
post(`${host}/post`, {
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'foo=bar&baz=qux',
})
  .then(result => {
    console.log('POST request response: ', result);
  })
  .catch(error => {
    console.error(error);
  });