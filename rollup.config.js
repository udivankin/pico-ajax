import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/index.js',
  format: 'umd',
  moduleName: 'pico-ajax',
  footer: 'if (typeof window !== "undefined") { window.PicoAjax = window["pico-ajax"]; }',
  plugins: [
    resolve({
      jsnext: true,
      main: true,
    }),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    }),
    uglify()
  ],
  external: ['zlib', 'http', 'https', 'url'],
  dest: 'dist/index.js'
};
