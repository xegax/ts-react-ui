const path = require("path");
const include = path.resolve(__dirname, '../');
const webpack = require('webpack');

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".scss"]
  },
  module: {
      rules: [
        {
            test: /\.tsx?/,
            loader: 'babel-loader!ts-loader',
            exclude: /node_modules/,
            include
          }, {
            test: /\.scss$/,
            use: [
			  'style-loader',
			  'css-loader',
			  'sass-loader'
			]
        }, {
          test: /\.(png|jpg|gif|eot|ttf|woff|woff2)$/,
          loader: 'url-loader',
          options: {
            limit: 10000
          }
        }, {
          test: /\.svg$/,
          include: /node_modules/,
          loader: 'url-loader'
        }, {
          test: /\.svg$/,
          exclude: /node_modules/,
          loader: 'svg-inline-loader'
        }
      ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      Promise: 'bluebird'
    }),
  ]
};