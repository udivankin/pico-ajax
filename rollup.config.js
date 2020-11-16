import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'src/server.js',
    watch: true,
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      plugins: [babel()]
    },
    plugins: [resolve()]
  },
  {
    input: 'src/server.js',
    watch: true,
    output: { file: 'dist/index.es.js', format: 'es' },
    plugins: [resolve()]
  },
  {
    input: 'src/browser.js',
    watch: true,
    output: [
      {
        file: 'dist/picoajax.min.js',
        format: 'iife',
        name: 'PicoAjax',
        plugins: [
          babel({
            exclude: 'node_modules/**' // only transpile our source code
          }),
          terser(),
        ]
      },
    ],
    plugins: [resolve()]
  }
];
