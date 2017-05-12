# Pico-Ajax
Very tiny (less than 1kb compressed) yet fully functional AJAX library with zero dependencies. It implements XMLHttpRequest returning Promise.

## Motivation
What makes Pico-Ajax different is that it's unaware on how data is passed. That requires a few more bytes of code to make a request, but gives much more control and (more important) better understanding of HTTP requests in exchange.

## Install
Via npm:

```
npm install --save pico-ajax
```

then import pico-ajax as UMD module
```javascript
import PicoAjax from 'pico-ajax';
```

Or use as a legacy module (will be available as PicoAjax in a global scope):
```html
<script src="/scripts/picoajax.min.js"></script>
```

## API

PicoAjax exposes all known http methods (connect, delete, get, head, options, patch, post and put) with two arguments: 'url' and 'options'.

Default options are:
```javascript
options: {
  async: true,          // Could be helpful since e.g. workers lack async support
  body: undefined,      // Request body, see details below
  headers: {},          // Request headers, see details below
  responseType: '',     // Could be 'json|arraybuffer|blob|document|text',
  password: undefined,  // Http auth password
  user: undefined,      // Http auth user
  onprogress: null,     // XMLHttpRequest onprogress callback
}
```

## Usage

You may start right now with a simple GET request:
```javascript
PicoAjax
  .get('/some/api/?foo=bar&baz=qux')
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

Sending data requires a little bit more effort:

```javascript
// Prepare form data using DOM form
const formData = new FormData(document.querySelector('form'));

// Or with a plain object
const foo = { bar: 'baz' };
const formData = new FormData();

Object.keys(foo).forEach(key => {
  formData.append(key, foo[key]);
});

// Perform POST request
PicoAjax
  .post('/some/api/', { body: formData })
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

**JSON**

```javascript
const body = JSON.stringify({ foo: 'bar', baz: 'qux' });
const headers = { 'Content-Type': 'application/json' };

PicoAjax
  .post('/some/api/', { body, headers })
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

**File upload**

```javascript
const formData = new FormData();
formData.append('userfile', fileInputElement.files[0]);

PicoAjax
  .post('/some/api/', { body: formData })
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

## Advanced use

If you are going to make quite a few similar requests in your project, you probably
may want to make one more layer of abstraction over Pico-Ajax. Here are few lines to
help you start with:
```javascript
import { isPlainObject } from 'lodash';
import qs from 'qs';

const defaultRequestOptions = {
  responseType: 'json', // Assuming we work with JSON-based API
  onprogress: coolProgressBarHandler,
};

const picoAjaxWrapper = (requestMethod, requestUrl, requestParams) => {
  if (requestMethod === 'get') {
    return PicoAjax.get(
      `${requestUrl}?${qs.stringify(requestParams)}`,
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

const Api = Object.keys(PicoAjax).reduce((result, method) => ({
  ...result,
  [method]: (url, params) => (
    picoAjaxWrapper(method, url, params)
      .catch((error) => { // Global API error handler
         console.error('API error:', error);

         throw error; // Enable to catch it further
      })
  )
}), {});

export default Api;
```

This will generate an Api object with all the methods that Pico-Ajax has, but with
custom progress indicator handler (coolProgressBarHandler) and different signature
(requestUrl, requestParams) plus some magic: for GET requests requestParams
will be stringifyed into URL, for POST request appended into request body.

## License

MIT found in `LICENSE` file.
