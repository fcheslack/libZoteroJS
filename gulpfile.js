'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const replace = require('gulp-replace-task');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const plumber = require('gulp-plumber');
const filter = require('gulp-filter');
const gulpif = require('gulp-if');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const replacements = [
	{
		match: /https:\/\/api.zotero.org/g,
		replacement: 'https://apidev.zotero.org'
	},
	{
		match: /http(s?):\/\/(www\.)?zotero.org/g,
		replacement: 'http$1://test.zotero.net'
	}
];


function onError(err) {
	console.warn(err);
}

function getBuild(dev) {
	var b = browserify({
		debug: true,
		entries: './libzoterojs.js',
		standalone: "Zotero",
		transform: [
        	['babelify', {
        		'presets': ['es2015']
    		}]
		]
	}).ignore('fake-indexeddb').ignore('xmlhttprequest');

	return b.bundle()
		.pipe(source('./libzoterojs.js'))
		.pipe(buffer())
		.pipe(plumber({errorHandler: onError}))
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(gulpif(dev, replace({
			patterns: replacements 
		})))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./build/'))
		.pipe(filter('*.js'))
		.pipe(uglify())
		.pipe(rename({ extname: '.min.js' }))
		.pipe(gulp.dest('build'));
}

gulp.task('default', function() {
	return getBuild(false);
});


gulp.task('dev', function() {
	return getBuild(true);
});

module.exports = {
	replacements: replacements,
	gulp: gulp
};