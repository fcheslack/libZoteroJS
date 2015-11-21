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
					'src/jquery.ba-bbq.min.js',
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
			build: {
				src: 'build/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.name %>.min.js'
			}
		},

	});

	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-contrib-concat');
	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task(s).
	grunt.registerTask('default', ['concat', 'babel', 'uglify']);

};
