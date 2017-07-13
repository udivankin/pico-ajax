const { get, post } = require('../../dist/index.js');

const host = 'https://httpbin.org';
const redirectCount = 3;

// Perform simple get request
get(`${host}/get?foo=bar`)
  .then(result => {
    console.log('GET request response: ', result);
  })
  .catch(error => {
    console.error(error);
  });

// Perform post request with form data
post(`${host}/post`, {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'foo=bar&baz=qux',
})
  .then(result => {
    console.log('POST request response: ', result);
  })
  .catch(error => {
    console.error(error);
  });

// Perform get request with redirects
get(`${host}//redirect/${redirectCount}`)
  .then(result => {
    console.log('GET request response: ', result);
  })
  .catch(error => {
    console.error(error);
  });
