# pico-ajax
Very tiny yet functional AJAX library which implements XMLHttpRequest.

## Install

Via npm:

```
npm install --save pico-ajax
```

## API

PicoAjax exposes methods with the same signature (url, options).

Options:
body: request body, see details below
headers: {},
password: '',
responseType: 'json|arraybuffer|blob|document|text',
user: ''


## Use

First you have to import pico-ajax as umd module

```javascript
import PicoAjax from 'pico-ajax';
```

of even further
```javascript
import { get, post } from 'pico-ajax';
```

Or as legacy module:
```html
<script src="/picoajax.min.js"></script>
```

**GET**

```javascript
PicoAjax
  .get('/some/api/')
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

**POST**

```javascript
const body = new FormData(document.querySelector('form'));

PicoAjax
  .post('/some/api/', { body })
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```

**POST JSON**

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
