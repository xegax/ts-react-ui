const path = require("path");
const include = path.resolve(__dirname, '../');

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
			test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
			loader: 'url-loader',
			options: {
			  limit: 10000
			}
		  }
      ]
  }
};