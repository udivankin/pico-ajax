import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'umd',
    name: 'pico-ajax',
    globals: {
      zlib: 'zlib', http: 'http', https: 'https', url: 'url'
    },
    footer: 'if (typeof window !== "undefined") { window.PicoAjax = window["pico-ajax"]; }',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    }),
    resolve({
      jsnext: true,
      main: true,
    }),
    terser(),
  ],
  external: ['zlib', 'http', 'https', 'url'],
};
