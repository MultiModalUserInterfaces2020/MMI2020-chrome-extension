'use strict'

let gulp = require('gulp'),
  clean = require('gulp-clean'),
  cleanhtml = require('gulp-cleanhtml'),
  concat = require('gulp-concat'),
  jshint = require('gulp-jshint'),
  zip = require('gulp-zip'),
  sass = require('gulp-sass'),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  cssnano = require('cssnano'),
  terser = require('gulp-terser');

let vendorScripts = [
  'node_modules/jquery/dist/jquery.min.js',

  // Bootstrap
  // 'node_modules/popper.js/dist/umd/popper.min.js',
  // 'node_modules/popper.js/dist/umd/popper-utils.min.js',
  // 'node_modules/bootstrap/js/dist/alert.js',
  // 'node_modules/bootstrap/js/dist/button.js',
  // 'node_modules/bootstrap/js/dist/carousel.js',
  // 'node_modules/bootstrap/js/dist/collapse.js',
  // 'node_modules/bootstrap/js/dist/dropdown.js',
  // 'node_modules/bootstrap/js/dist/modal.js',
  // 'node_modules/bootstrap/js/dist/toast.js',
  // 'node_modules/bootstrap/js/dist/tooltip.js',
  // 'node_modules/bootstrap/js/dist/popover.js',
  // 'node_modules/bootstrap/js/dist/scrollspy.js',
  // 'node_modules/bootstrap/js/dist/tab.js',
  // 'node_modules/bootstrap/js/dist/util.js',
];

// Clean build directory
gulp.task('clean', function () {
  return gulp.src('build/*', { read: false })
    .pipe(clean())
})

gulp.task('copy', function () {
  gulp.src('src/fonts/', { allowEmpty: true })
    .pipe(gulp.dest('build/fonts'))
  gulp.src('src/icons/', { allowEmpty: true })
    .pipe(gulp.dest('build/icons'))
  gulp.src('src/images/*', { allowEmpty: true })
    .pipe(gulp.dest('build/images'))
  gulp.src('src/_locales/**', { allowEmpty: true })
    .pipe(gulp.dest('build/_locales'))
  return gulp.src('src/manifest.json')
    .pipe(gulp.dest('build'))
})

gulp.task('html', function () {
  return gulp.src('src/*.html')
    .pipe(cleanhtml())
    .pipe(gulp.dest('build'))
})

gulp.task('jshint', function () {
  return gulp.src('src/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
})

gulp.task('js', function () {
  gulp.src(vendorScripts)
    .pipe(concat('vendor.js'))
    .pipe(terser())
    .pipe(gulp.dest('src/dist/scripts'));

  return gulp.src('src/js/*.js')
    .pipe(terser())
    .pipe(gulp.dest('src/dist/scripts'))
})

gulp.task('scripts', gulp.series('jshint', 'js', function () {
  return gulp.src(['src/dist/scripts/*.js', '!src/scripts/vendors/**/.js'])
    .pipe(gulp.dest('build/dist/scripts'))
}))

gulp.task('scss', function () {
  return gulp.src('src/scss/*.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(postcss([
      autoprefixer(),
      cssnano()
    ]))
    .pipe(gulp.dest('src/dist/styles'))
})

gulp.task('styles', function () {
  return gulp.src('src/dist/styles/*')
    .pipe(gulp.dest('build/dist/styles'))
})

gulp.task('zip', gulp.series('html', 'scripts', 'scss', 'styles', 'copy', () => {
  let manifest = require('./src/manifest'),
    distFileName = manifest.name + ' v' + manifest.version + '.zip';

  return gulp.src(['build/', '!build/scripts/**/*.map'])
    .pipe(zip(distFileName))
    .pipe(gulp.dest('dist'))
}))

gulp.task('watch', function() {
  gulp.watch('src/scss/*.scss', gulp.series('scss'));
  gulp.watch('src/js/*.js', gulp.series('js'));
  gulp.watch('gulpfile.js', gulp.series('js'));
})

gulp.task('build', gulp.series('clean', 'zip'));
gulp.task('default', gulp.series('watch'));
