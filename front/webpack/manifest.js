const path = require('path');

const
  NODE_ENV = process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT = NODE_ENV === 'development',
  IS_PRODUCTION = NODE_ENV === 'production';

const dir = src => path.join(__dirname, src);

const paths = {
  src: dir('../src'),
  build: dir('../build'),
};

const outputFiles = {
  bundle: 'bundle.js',
  vendor: 'vendor.js',
  css: 'style.css',
};

const entries = {
  js: 'index.js',
};

module.exports = {
  paths,
  outputFiles,
  entries,
  NODE_ENV,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
};
