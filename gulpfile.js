const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('transpile', () => {
    gulp.src('./src/**/*.js')
        .pipe(babel({
          "presets": ["es2015"]
        }))
        .pipe(gulp.dest('./public'));

    gulp.src('./src/**/!(*.js|*.map|*.src)')
        .pipe(gulp.dest('./public'));
});

gulp.task('watch', () => {
    gulp.watch('src/**/**.*', ['transpile']);
});

gulp.task('default', ['transpile', 'watch']);
