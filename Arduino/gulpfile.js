/* Requires */
var gulp = require('gulp');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var htmlmin = require('gulp-htmlmin');
var cleancss = require('gulp-clean-css');
var terser = require('gulp-terser');
var gzip = require('gulp-gzip');
var del = require('del');

/* HTML Task */
gulp.task('html', function() {
	return gulp
		.src([ 'html/*.html', 'html/*.htm' ])
		.pipe(plumber())
		.pipe(
			htmlmin({
				collapseWhitespace: true,
				removeComments: true,
				minifyCSS: true,
				minifyJS: true
			})
		)
		.pipe(gzip())
		.pipe(gulp.dest('data/www'));
});

/* CSS Task */
gulp.task('css', function() {
	return gulp
		.src([ 'html/css/bootstrap.css', 'html/style.css' ])
		.pipe(plumber())
		.pipe(concat('esps.css'))
		.pipe(cleancss())
		.pipe(gzip())
		.pipe(gulp.dest('data/www'));
});

/* JavaScript Task */
gulp.task('js', function() {
	return gulp
		.src([ 'html/js/jquery*.js', 'html/js/bootstrap.js', 'html/js/jqColorPicker.js', 'html/script.js' ])
		.pipe(plumber())
		.pipe(concat('esps.js'))
		.pipe(terser())
		.pipe(gzip())
		.pipe(gulp.dest('data/www'));
});

/* Image Task */
gulp.task('image', function() {
	return gulp.src([ 'html/**/*.png', 'html/**/*.ico' ]).pipe(plumber()).pipe(gulp.dest('data/www'));
});

/* Clean Task */
gulp.task('clean', function() {
	return del([ 'data/www/*' ]);
});

/* Watch Task */
gulp.task('watch', function() {
	gulp.watch('html/*.html', gulp.series('html'));
	gulp.watch('html/**/*.css', gulp.series('css'));
	gulp.watch('html/**/*.js', gulp.series('js'));
});

/* Default Task */
gulp.task('default', gulp.series([ 'clean', 'html', 'css', 'js', 'image' ]));
