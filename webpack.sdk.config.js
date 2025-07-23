const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './sdk-integration/cjs-bridge.js',
  mode: 'production',
  
  output: {
    path: path.resolve(__dirname, 'static/js'),
    filename: 'srsly-sdk-cjs-bridge.bundle.js',
    library: 'SRSLYSDKBridge',
    libraryTarget: 'window',
    clean: true
  },
  
  resolve: {
    fallback: {
      "assert": require.resolve("assert"),
      "buffer": require.resolve("buffer"),
      "console": require.resolve("console-browserify"),
      "constants": require.resolve("constants-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "domain": require.resolve("domain-browser"),
      "events": require.resolve("events"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "path": require.resolve("path-browserify"),
      "punycode": require.resolve("punycode"),
      "process": require.resolve("process/browser"),
      "querystring": require.resolve("querystring-es3"),
      "stream": require.resolve("stream-browserify"),
      "string_decoder": require.resolve("string_decoder"),
      "sys": require.resolve("util"),
      "timers": require.resolve("timers-browserify"),
      "tty": require.resolve("tty-browserify"),
      "url": require.resolve("url"),
      "util": require.resolve("util"),
      "vm": require.resolve("vm-browserify"),
      "zlib": require.resolve("browserify-zlib"),
      "fs": false,
      "net": false,
      "tls": false
    }
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['> 1%', 'last 2 versions']
                }
              }]
            ]
          }
        }
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async'
      }
    ]
  },
  
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.ANCHOR_BROWSER': JSON.stringify('true'),
      'global': 'globalThis'
    }),

    new webpack.IgnorePlugin({
      resourceRegExp: /^(fs|net|tls)$/
    })
  ],
  
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: false
  },
  
  performance: {
    maxEntrypointSize: 3000000, // 3MB
    maxAssetSize: 3000000, // 3MB
    hints: 'warning'
  },
  
  experiments: {
    asyncWebAssembly: true
  },

  devtool: 'source-map'
};