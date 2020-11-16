const PicoAjaxCJS = require('../dist/index.cjs.js');

describe('PicoAjax', function() {
  describe('Public methods', function() {
    const PUBLIC_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'connect', 'head'];

    it('should expose full number of methods', function() {
      PUBLIC_METHODS.forEach(method => {
        expect(PicoAjaxCJS[method]).toBeDefined();
      });
    });

    it('should not have other public properties', function() {
      for (const libraryProperty in PicoAjaxCJS) {
        expect(PUBLIC_METHODS.indexOf(libraryProperty)).toBeGreaterThan(-1);
      }
    });
  });
});
