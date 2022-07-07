/* Requires */
var gulp = require('gulp');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var htmlmin = require('gulp-htmlmin');
var cleancss = require('gulp-clean-css');
var terser = require('gulp-terser');
var gzip = require('gulp-gzip');
var del = require('del');
var exec = require('child_process').exec;
var header = require('gulp-header');
//compile
const COMPILE_OPTIONS = {
	MKSPIFFS:
		'C:\\Users\\eric\\AppData\\Local\\Arduino15\\packages\\esp8266\\tools\\mkspiffs\\2.5.0-4-b40a506\\mkspiffs.exe',
	PYTHON3: 'C:\\Users\\eric\\AppData\\Local\\Arduino15\\packages\\esp8266\\tools\\python3\\3.7.2-post1\\python3.exe',
	UPLOAD_PY:
		'C:\\Users\\eric\\AppData\\Local\\Arduino15\\packages\\esp8266\\hardware\\esp8266\\2.6.3\\tools\\upload.py',

	COM_PORT: 'COM6',
	BAUD: '256000'
};

/* HTML Task */
gulp.task('html', function () {
	return gulp
		.src(['html/*.html', 'html/*.htm'])
		.pipe(plumber())
		// .pipe(
		// 	htmlmin({
		// 		collapseWhitespace: true,
		// 		removeComments: true,
		// 		minifyCSS: true,
		// 		minifyJS: true
		// 	})
		// )
		.pipe(gzip())
		.pipe(gulp.dest('data/www'))
});

/* Generate HTML Task*/
gulp.task('generate-html', function () {
	return gulp
		.src([
			'html/pages/_header.html',
			'html/pages/home/index.html',
			'html/pages/network/index.html',
			'html/pages/device/index.html',
			'html/pages/test/index.html',
			'html/pages/admin/index.html',
			'html/pages/_footer.html'
		])
		.pipe(concat('index.html'))
		.pipe(header(`<!--\n
		Generated With Gulp @` + new Date() + `\n
		*** DO NOT MANUALLY EDIT THIS FILE ***\n
		
		Edit project/html/pages/ files, then run 'gulp generate-html'
		-->\n`))
		.pipe(gulp.dest('html'));
});

/* Generate JS Task*/
gulp.task('generate-js', function () {
	return gulp
		.src([
			'html/pages/home/script.js',
			'html/pages/network/script.js',
			'html/pages/device/script.js',
			'html/pages/test/script.js',
			'html/pages/admin/script.js',
		])
		.pipe(concat('generated.js'))
		.pipe(header(`/*\n
		Generated With Gulp @` + new Date() + `\n
		*** DO NOT MANUALLY EDIT THIS FILE ***\n
		
		Edit project/html/pages/ files, then run 'gulp generate-js'
		*/\n\n`))
		.pipe(gulp.dest('html'));
});

/* CSS Task */
gulp.task('css', function () {
	return gulp
		.src(['html/css/bootstrap.css', 'html/css/toastr.min.css', 'html/style.css'])
		.pipe(plumber())
		.pipe(concat('esps.css'))
		.pipe(cleancss())
		.pipe(gzip())
		.pipe(gulp.dest('data/www'));
});

/* JavaScript Task */
gulp.task('js', function () {
	return gulp
		.src([
			'html/js/jquery*.js',
			'html/js/bootstrap.js',
			'html/js/toastr.min.js',
			'html/generated.js',
			'html/script.js'
		])
		.pipe(plumber())
		.pipe(concat('esps.js'))
		.pipe(terser())
		.pipe(gzip())
		.pipe(gulp.dest('data/www'));
});

/* Image Task */
gulp.task('image', function () {
	return gulp.src(['html/**/*.png', 'html/**/*.ico']).pipe(plumber()).pipe(gulp.dest('data/www'));
});

/* Clean Task */
gulp.task('clean', function () {
	return del(['data/www/*']);
});

/* Watch Task */
gulp.task('watch', function () {
	gulp.watch('html/*.html', gulp.series('html'));
	gulp.watch('html/**/*.css', gulp.series('css'));
	gulp.watch('html/**/*.js', gulp.series('js'));
});

/*Compile SPIFFS*/
gulp.task('spiffs-compile', function (cb) {
	let cmd = COMPILE_OPTIONS.MKSPIFFS + ' -c data -p 256 -b 8192 -s 2076672 tmp/out.spiffs.bin';
	console.log('Command: ' + cmd);
	exec(cmd, function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});

/* Spiffs - upload to device */
gulp.task('spiffs-upload', function (cb) {
	let cmd =
		COMPILE_OPTIONS.PYTHON3 +
		' ' +
		COMPILE_OPTIONS.UPLOAD_PY +
		' --chip esp8266 --port ' +
		COMPILE_OPTIONS.COM_PORT +
		' --baud ' +
		COMPILE_OPTIONS.BAUD +
		' write_flash 0x200000 tmp/out.spiffs.bin';
	console.log('Command: ' + cmd);
	exec(cmd, function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});

// Generate HTML and JS task
gulp.task('generate', gulp.series(['generate-html', 'generate-js']));

/*Spiffs - Compile and upload to device */
gulp.task('spiffs', gulp.series(['spiffs-compile', 'spiffs-upload']));

/* Default Task */
gulp.task('default', gulp.series(['clean', 'generate-html', 'html', 'css', 'generate-js', 'js', 'image', 'spiffs']));

