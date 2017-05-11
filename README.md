# Pico-Ajax
Very tiny (less than 1kb compressed) yet functional AJAX library with zero dependencies. It implements XMLHttpRequest returning Promise.

# Motivation
What makes Pico-Ajax different is that it's unaware how data is passed. That requires a few more bytes of code to make a request but gives much more control and (more important) better understanding of HTTP requests in exchange.

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
<script src="/picoajax.min.js"></script>
```

## API

PicoAjax exposes all known http methods with signature (url, options).

Default options are:
```javascript
options: {
  async: true,          // Could be helpful since e.g. workers lack async support
  body: undefined,      // Request body, see details below
  headers: {},          // Request headers, see details below
  responseType: '',     // Could be 'json|arraybuffer|blob|document|text',
  password: undefined,  // Http auth password
  user: undefined,      // Http auth user
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

**Form data**

Init FormData using DOM form:
```javascript
const formData = new FormData(document.querySelector('form'));
```

**Plain object**

```javascript
const foo = { bar: 'baz' };
const formData = new FormData();

Object.keys(foo).forEach(key => {
  formData.append(key, foo[key]);
});
```

Following POST method call:

```javascript
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
  .post('/some/api/', { body, headers })
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

## Advanced use

If you are going to make quite a few similar requests in your project, you probably
may want to make one more layer of abstraction over Pico-Ajax.

## License

MIT found in `LICENSE` file.
