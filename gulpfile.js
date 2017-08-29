const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const tsify = require("tsify");

gulp.task('move-assets', () => {
  gulp.src('./src/**/!(*.ts|*.map|*.src)')
    .pipe(gulp.dest('./public'));
});

gulp.task('watch', () => {
  gulp.watch('src/**/**.*', ['compile-tsc', 'move-assets']);
});

gulp.task('compile-tsc', () => {
  return browserify({
      basedir: '.',
      debug: true,
      entries: ['./src/javascripts/main.ts'],
      cache: {},
      packageCache: {}
    })
    .plugin(tsify, {
      allowJs: true,
      target: 'es5'
    })
    .bundle()
    .pipe(source('main.js'))
    .pipe(gulp.dest("public/javascripts"));
});

gulp.task('default', ['compile-tsc', 'move-assets', 'watch']);
