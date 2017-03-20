var WebpackDevServer = require('webpack-dev-server');
var webpack = require('webpack');
var config = require('./webpack.config.js');
var path = require('path');

var compiler = webpack(config);
var server = new WebpackDevServer(compiler, {
	hot: true,
	// filename: config.output.filename,
	publicPath: config.output.publicPath,
	contentBase: config.output.path,
	compress: true,
	stats: 'errors-only'
});
server.listen(8080, 'localhost', function() {});
