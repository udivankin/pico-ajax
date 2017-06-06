## Using PicoAjax to create you own perfect API module

Example implementation will generate an Api object with all the methods that Pico-Ajax has,
but with custom progress indicator handler (coolProgressBarHandler) and different signature
(requestUrl, requestParams) plus some magic: for GET requests requestParams
will be stringified into URL, for POST request appended into request body.

Now we can make GET and POST requests like that:
```javascript
import Api from '/Api.js';

Api
  .get('/some/api/', { foo: 'bar', baz: 'qux' })
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });

Api
  .post('/some/api/', { foo: 'bar', baz: 'qux' })
  .then(result => {
    console.log(result);
  })
  .catch(error => {
    console.error(error);
  });
```
... plus log errors and display progress in centralized way.
