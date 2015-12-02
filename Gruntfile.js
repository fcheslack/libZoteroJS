module.exports = function(grunt) {
	//require("load-grunt-tasks")(grunt); // npm install --save-dev load-grunt-tasks

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		babel: {
			options: {
				presets: ['es2015', 'react']
			},
			dist: {
				src: "build/<%= pkg.name %>.js",
				dest: "build/<%= pkg.name %>.js"
			}
		},
		concat: {
			options:{},
			dist:{
				src: [
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
				],
				dest: "build/<%= pkg.name %>.js"
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			dist: {
				src: 'build/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.name %>.min.js'
			}
		},
		"string-replace": {
			dist: {
				src: 'build/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.name %>.js',
				options: {
					replacements: [
						{
							pattern: "https://apidev.zotero.org",
							replacement: "https://api.zotero.org"
						},
						{
							pattern: "http://test.zotero.net",
							replacement: "http://zotero.org"
						},
						{
							pattern: "https://test.zotero.net",
							replacement: "https://zotero.org"
						},
						{
							pattern: "http://test.zotero.net",
							replacement: "http://www.zotero.org"
						},
						{
							pattern: "https://test.zotero.net",
							replacement: "https://www.zotero.org"
						},
					]
				}
			},
			dev: {
				src: 'build/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.name %>.js',
				options: {
					replacements: [
						{
							pattern: "https://api.zotero.org",
							replacement: "https://apidev.zotero.org"
						},
						{
							pattern: "http://zotero.org",
							replacement: "http://test.zotero.net"
						},
						{
							pattern: "https://zotero.org",
							replacement: "https://test.zotero.net"
						},
						{
							pattern: "http://www.zotero.org",
							replacement: "http://test.zotero.net"
						},
						{
							pattern: "https://www.zotero.org",
							replacement: "https://test.zotero.net"
						},
					]
				}
			}
			
		}
	});

	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-contrib-concat');
	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-string-replace');

	// Default task(s).
	grunt.registerTask('default', ['concat', 'string-replace:dist', 'babel', 'uglify']);
	grunt.registerTask('dist', ['concat', 'string-replace:dist', 'babel', 'uglify']);
	grunt.registerTask('dev', ['concat', 'string-replace:dev', 'babel', 'uglify']);
};
