const PicoAjax = require('../dist/index.js');

describe('PicoAjax', function() {
  describe('Public methods', function() {
    const PUBLIC_METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'connect', 'head'];

    it('should expose full number of methods', function() {
      PUBLIC_METHODS.forEach(method => {
        expect(PicoAjax[method]).toBeDefined();
      });
    });

    it('should not have other public properties', function() {
      for (const libraryProperty in PicoAjax) {
        expect(PUBLIC_METHODS.indexOf(libraryProperty)).toBeGreaterThan(-1);
      }
    });
  });
});
