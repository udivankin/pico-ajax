# PicoAjax
Universal, very tiny (browser version is ~1kb uncompressed) yet fully functional AJAX library with zero dependencies. It implements browser XMLHttpRequest and Node.js http module returning Promise.

## Motivation
What makes Pico-Ajax different is that it's unaware on how data is passed. That requires a few more bytes of code to make a request, but gives much more control and (more important) better understanding of HTTP requests in exchange. This also makes it perfect for building your own DIY API module.

## Limitations
Since server implementation is mostly synchronous it's not recommended to use PicoAjax in loaded projects.

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
  body: undefined,        // Request body, see details below
  headers: {},            // Request headers, see details below
  password: undefined,    // HTTP auth password
  user: undefined,        // HTTP auth user
  timeout: undefined,     // Request timeout
  responseType: '',       // [Browser-only] Could be 'json|arraybuffer|blob|document|text',
  async: true,            // [Browser-only] Could be helpful since e.g. workers lack async support
  onProgress: undefined,  // [Browser-only] XMLHttpRequest onprogress callback
  withCredentials: false, // [Browser-only] Whether should send cookies with cross-origin requests
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
**Multipart/form-data**

```javascript
// Prepare form data using DOM form (Browser only)
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
may want to make one more layer of abstraction over Pico-Ajax. Please refer to api-example.js
module in examples directory.

## License

MIT found in `LICENSE` file.
