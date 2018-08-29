import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'src/index.js',
  name: 'pico-ajax',
  footer: 'if (typeof window !== "undefined") { window.PicoAjax = window["pico-ajax"]; }',
  plugins: [
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    }),
    resolve({
      jsnext: true,
      main: true,
    }),
    uglify()
  ],
  external: ['zlib', 'http', 'https'],
  globals: {
    zlib: 'zlib', http: 'http', https: 'https'
  },
  output: {
    file: 'dist/index.js',
    format: 'umd',
  }
};
