import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

export default [
  {
    input: 'src/server.ts',
    watch: true,
    output: {
      dir: 'dist/cjs',
      entryFileNames: 'picoajax.js',
      exports: 'auto',
      format: 'cjs',
    },
    external: ['http', 'https', 'zlib', 'url'],
    plugins: [
      resolve(),
      typescript({
        lib: ['ES2020', 'DOM'],
        target: 'ES2015',
      }),
      copy({
        targets: [
          { src: 'src/index.d.ts', dest: 'dist/es' },
        ]
      }),
    ]
  },
  {
    input: 'src/server.ts',
    watch: true,
    output: {
      entryFileNames: 'picoajax.js',
      dir: 'dist/es',
      format: 'es',
    },
    external: ['http', 'https', 'zlib', 'url'],
    plugins: [
      resolve(),
      typescript({
        lib: ['ES2020', 'DOM'],
        target: 'ES2019',
      }),
      copy({
        targets: [
          { src: 'src/index.d.ts', dest: 'dist/cjs' },
        ]
      }),
    ]
  },
  {
    input: 'src/browser.ts',
    watch: true,
    output: [
      {
        file: 'dist/browser/picoajax.min.js',
        format: 'iife',
        name: 'PicoAjax',
        plugins: [
          terser({ 
            format: {
              comments: false,
            },
          }),
        ]
      },
      {
        file: 'dist/browser/picoajax.js',
        format: 'iife',
        name: 'PicoAjax',
      },
    ],
    plugins: [
      typescript({
        lib: ['ES2020', 'DOM'],
        target: 'ES5',
      }),
    ]
  }
];
