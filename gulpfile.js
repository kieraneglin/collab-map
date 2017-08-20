const gulp = require('gulp');
const babel = require('gulp-babel');
const browserify = require('gulp-browserify');

gulp.task('transpile', () => {
  gulp.src('./src/javascripts/main.js')
    .pipe(browserify({
      insertGlobals: true
    }))
    .pipe(babel({
      "presets": ["es2015"]
    }))
    .pipe(gulp.dest('./public/javascripts'));

  gulp.src('./src/**/!(*.js|*.map|*.src)')
    .pipe(gulp.dest('./public'));
});

gulp.task('watch', () => {
  gulp.watch('src/**/**.*', ['transpile']);
});

gulp.task('default', ['transpile', 'watch']);
