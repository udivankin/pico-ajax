/**
 * Webpack config
 *
 * @global __dirname, require, module
 */

const webpack = require('webpack');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const path = require('path');

const getConfig = (env, library, filename, libraryTarget) => ({
  entry: `${__dirname}/src/index.js`,
  devtool: env === 'development' ? 'source-map' : undefined,
  output: {
    path: `${__dirname}/dist`,
    filename,
    library,
    libraryTarget,
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules)/
      },
    ],
  },
  resolve: {
    modules: [path.resolve('./src')],
    extensions: ['.js'],
  },
  plugins: env === 'development'
    ? []
    : [new UglifyJsPlugin({ minimize: true })]
});

module.exports = (env = {}) => ([
  getConfig(env, 'pico-ajax', 'index.js', 'umd'),
  getConfig(env, 'PicoAjax', 'legacy/picoajax.min.js', 'var'),
]);
