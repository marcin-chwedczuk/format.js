(function() {
    'use strict';

    // based on: http://blog.nodejitsu.com/npmawesome-9-gulp-plugins/

    var gulp = require('gulp');
    var clean = require('gulp-clean');
    var concat = require('gulp-concat');
    var uglify = require('gulp-uglify');
    var gutil = require('gulp-util');
    var rename = require('gulp-rename');
    var filesize = require('gulp-filesize');
    var watch = require('gulp-watch');
    var batch = require('gulp-batch');
    var mocha = require('gulp-mocha');
    var jshint = require('gulp-jshint');
    var betterConsole = require('better-console');
    var source = require('vinyl-source-stream');
    var browserify = require('browserify');

    var SOURCE_DIR = 'src';
    var DEST_DIR = 'dist';
    var TEST_DIR = 'test';

    var FORMAT_LIBRARY_NAME = 'format.js';
    var FORMAT_LIBRARY_NAME_MIN = FORMAT_LIBRARY_NAME.replace('.js', '.min.js');
    var BROWSERIFIED_LIBRARY_NAME = FORMAT_LIBRARY_NAME.replace('.js', '.browserified.js');

    var SOURCE_JS_FILES = SOURCE_DIR + '/*.js';
    var TEST_JS_FILES = TEST_DIR + '/*.js';
    var DEST_JS_FILES = DEST_DIR + '/*.js';

    var BROWSERIFIED_JS_FILES = DEST_DIR + '/' + BROWSERIFIED_LIBRARY_NAME;

    var JSHINT_REPORTER = 'jshint-stylish';

    gulp.task('jshint', function() {
        return gulp.src([SOURCE_JS_FILES, TEST_JS_FILES])
            .pipe(jshint())
            .pipe(jshint.reporter(JSHINT_REPORTER))
            .pipe(jshint.reporter('fail'))
    });

    gulp.task('browserify', function() {
        var b = browserify(['./src/format.js', './src/scan.js'], { debug: true });

        return b.bundle()
            .pipe(source(BROWSERIFIED_LIBRARY_NAME))
            .pipe(gulp.dest(DEST_DIR));
    });

    gulp.task('build', ['jshint', 'browserify'], function() {
        return gulp.src(BROWSERIFIED_JS_FILES)
            .pipe(gulp.dest(DEST_DIR))
            .pipe(uglify())
            .pipe(rename(FORMAT_LIBRARY_NAME_MIN))
            .pipe(gulp.dest(DEST_DIR))
            .pipe(filesize())
            .on('error', gutil.log);
    });

    gulp.task('test', ['build'], function() {
        return gulp.src(TEST_JS_FILES, { read: false })
            .pipe(mocha({
                style: 'bdd',
                reporter: 'nyan',
            }));
    });

    gulp.task('clean', function() {
        return gulp.src(DEST_JS_FILES, { read: false })
            .pipe(clean())
            .on('error', gutil.log);
    });

    gulp.task('watch', function() {
        watch([SOURCE_JS_FILES, TEST_JS_FILES], batch(function(events, done) {
            betterConsole.clear();
            gulp.start('test', done);
        }));   
    });
    
    gulp.task('default', ['build'], function() {});

}());
