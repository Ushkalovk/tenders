const
  path = require('path'),
  manifest = require('./manifest'),
  devServer = require('./devServer'),
  rules = require('./rules'),
  plugins = require('./plugins');


const entry = [
  path.join(manifest.paths.src, 'assets', 'scripts', manifest.entries.js),
];

const resolve = {
  extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js'],
  modules: [
    path.join(__dirname, '../node_modules'),
    path.join(manifest.paths.src, ''),
  ],
};

module.exports = {
  devtool: manifest.IS_PRODUCTION ? false : 'cheap-eval-source-map',
  context: path.join(manifest.paths.src, manifest.entries.js),
  watch: !manifest.IS_PRODUCTION,
  entry,
  output: {
    path: manifest.paths.build,
    publicPath: '',
    filename: manifest.outputFiles.bundle,
  },
  module: {
    rules,
  },
  resolve,
  plugins,
  devServer,
};
