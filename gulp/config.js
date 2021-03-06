var dest = './dist';
var src = './src';
var gutil = require('gulp-util');

module.exports = {
  server: {
    settings: {
      root: dest,
      host: 'localhost',
      port: 8080,
      livereload: {
        port: 35929
      }
    }
  },
  sass: {
    src: src + '/styles/style.scss',
    dest: dest + '/styles',
    settings: {
      indentedSyntax: false, // Enable .sass syntax?
      imagePath: '/res/images' // Used by the image-url helper
    }
  },
  fonts: {
    src: src + '/fonts/**/*',
    dest: dest + '/fonts'
  },
  res: {
    src: src + '/res/**/*',
    dest: dest + '/res'
  },
  browserify: {
    settings: {
      transform: ['stringify', 'babelify']
    },
    src: src + '/js/index.js',
    dest: dest + '/js',
    outputName: 'index.js',
    debug: true
  },
  html: {
    src: 'src/index.html',
    dest: dest
  },
  watch: {
    src: 'src/**/*.*',
    tasks: ['build']
  }
};
