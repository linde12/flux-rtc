var gulp = require('gulp');
var config = require('../config').watch;

gulp.task('watch', ['watchify'], function() {
  gulp.watch(config.src, config.tasks);
});
