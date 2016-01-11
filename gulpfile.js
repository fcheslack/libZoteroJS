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

const sources = [
	'src/promise-0.1.1.min.js',
	'src/spark-md5.min.js',
	//'IndexedDBShim.min.js',
	'src/Base.js',
	'src/Ajax.js',
	'src/ApiObject.js',
	'src/ApiResponse.js',
	'src/Net.js',
	'src/Library.js',
	'src/Container.js',
	'src/Collections.js',
	'src/Items.js',
	'src/Tags.js',
	'src/Groups.js',
	'src/Searches.js',
	'src/Deleted.js',
	'src/Collection.js',
	'src/Item.js',
	'src/ItemMaps.js',
	'src/Tag.js',
	'src/Search.js',
	'src/Group.js',
	'src/User.js',
	'src/Utils.js',
	'src/Url.js',
	'src/File.js',
	'src/Idb.js',
	//sets of functions with similar purposes that should probably be combined and clarified
	'src/CollectionFunctions.js',
	'src/ItemFunctions.js',
	'src/TagFunctions.js',
	'src/LibraryCache.js',
	'src/Preferences.js',
	'src/*.js',
];

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
	return gulp.src(sources)
		.pipe(plumber({errorHandler: onError}))
		.pipe(sourcemaps.init())
		.pipe(gulpif(dev, replace({
			patterns: replacements 
		})))
		.pipe(babel({
			presets:  ['es2015', 'react']
		}))
		.pipe(concat('libzoterojs.js'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('build'))
		.pipe(filter('*.js'))
		.pipe(uglify())
		.pipe(rename({ extname: '.min.js' }))
		// .pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('build'));
}

gulp.task('default', function() {
	return getBuild(false);
});


gulp.task('dev', function() {
	return getBuild(true);
});

module.exports = {
	sources: sources,
	replacements: replacements,
	gulp: gulp
};