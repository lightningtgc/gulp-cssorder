/*
 * gulp-cssorder
 * MIT @ gctang
 *
 */

'use strict'

var cssOrder = require('cssorder');
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');
var PluginError = gutil.PluginError;

// Constants
var PLUGIN_NAME = 'gulp-cssorder';
var SUPPORTED_EXTENSIONS = ['.css', '.sass', '.scss', '.less'];

// Plugin level function (dealing with files)
function gulpPlugin(configPath, options) {

  if (arguments.length == 1 && typeof configPath === 'object') {
    options = configPath;
    configPath = options.configPath;
  } else if (arguments.length == 2 && typeof options === 'boolean') {
    options = { verbose: options }; // for backward compatibility
  }

  options = options || {};
  configPath = configPath || null;

  var verbose = options.verbose || false;

  // Create a stream through which each file will pass
  var stream = through.obj(function(file, enc, cb) {

    if (file.isNull()) {
      // Do nothing
    } else if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    } else if (file.isBuffer() && SUPPORTED_EXTENSIONS.indexOf(path.extname(file.path)) !== -1) {

      if (verbose) {
        gutil.log(PLUGIN_NAME, 'Processing ' + gutil.colors.magenta(file.path));
      }

      if (configPath && !fs.existsSync(configPath)) {
        this.emit('error', new PluginError(PLUGIN_NAME, 'Configuration file not found: ' + gutil.colors.magenta(configPath)));
        return cb();
      }

      configPath = cssOrder.getCustomConfigPath(configPath || path.join(path.dirname(file.path), '.csscomb.json'));
      var config = cssOrder.getCustomConfig(configPath);

      if (verbose) {
        gutil.log(PLUGIN_NAME, 'Using configuration file ' + gutil.colors.magenta(configPath));
      }

      var order = new cssOrder(config || 'csscomb');
      var syntax = file.path.split('.').pop();

      try {
        var output = order.processText(
          file.contents.toString('utf8'), {
            syntax: syntax,
            filename: file.path
          });
        file.contents = new Buffer(output);
      } catch (err) {
        this.emit('error', new PluginError(PLUGIN_NAME, err));
      }
    }

    // make sure the file goes through the next gulp plugin
    this.push(file);
    // tell the stream engine that we are done with this file
    return cb();
  });

  // Return the file stream
  return stream;
}

// Export the plugin main function
module.exports = gulpPlugin;
