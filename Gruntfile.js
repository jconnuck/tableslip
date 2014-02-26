// Generated on 2013-09-02 using reaction 0.0.0
'use strict';
var LIVERELOAD_PORT = 35729;

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    watch: {
      options: {
        nospawn: true,
        livereload: LIVERELOAD_PORT
      },
      livereload: {
        files: [
          'index.html',
          'app/components/**/*',
          'app/stores/**/*.js',
          'app/styles/**/*.scss'
        ],
        tasks: ['build:dev']
      }
    },
    express: {
      options: {
        port: 8080,
        hostname: 'localhost',
        open: true,
        bases: ['bower_modules', 'public'],
        server: 'app.js'
      },
      dev: {
        options: {
          debug: true,
          livereload: true
        }
      },
      prod: {

      }
    },
    react: {
      options: {
        extension: 'jsx'
      },
      build: {
        files: {
          'build/js/components': 'app/components'
        }
      }
    },
    browserify: {
      main: {
        src: 'app/lib/main.js',
        dest: 'build/js/main.js',
        options: {
          aliasMappings: [
            {
              flatten: true,
              cwd: 'build/js/components',
              src: ['**/*.js']
            },
            {
              flatten: true,
              cwd: 'app/lib',
              src: ['**/*.js']
            },
            {
              flatten: true,
              cwd: 'app/stores',
              src: ['**/*.js']
            },
            {
              cwd: 'app/components/mixins',
              src: ['*.js'],
              dest: 'mixins'
            },
          ],
        }
      }
    },
    sass: {
      prod: {
        style: 'compressed',
        options: {
          loadPath: ['app/components'],
          compass: true,
        },
        files: {
          'build/css/styles.css': 'app/styles/main.scss'
        }
      },
      dev: {
        options: {
          loadPath: ['app/components'],
          compass: true,
        },
        files: {
          'build/css/styles.css': 'app/styles/main.scss'
        }
      }
    },
    copy: {
      build: {
        expand: true,
        cwd: 'build/',
        src: ['css/styles.css', 'js/main.js'],
        dest: 'public/'
      }
    },
    uglify: {
      prod: {
        src: 'build/js/main.js',
        dest: 'public/js/main.js'
      }
    },
    cssmin: {
      options: {
        report: 'gzip'
      },
      prod: {
        src: 'build/css/styles.css',
        dest: 'public/css/styles.css'
      }
    },
    compress: {
      phonegap: {
        options: {
          archive: '../phonegap.zip'
        },
        files: [
          { src: ['bower_modules/**', 'public/**', 'config.xml'], dest: 'phonegap/' },
        ]
      }
    },
    'phonegap-build': {
      phonegap: {      
        options: {
          archive: '../phonegap.zip',
          appId: '680124',
          user: {
            email: 'dev.lightwait@gmail.com',
            password: 'ML9okquyQCH7+UP2xCwGxhA)*Byzdn'
          }
        }
      }
    }
  });
  grunt.registerTask('phonegap', ['build', 'compress:phonegap', 'phonegap-build']);
  grunt.registerTask('build:prod', ['react', 'browserify', 'sass:prod', 'cssmin', 'uglify']);
  grunt.registerTask('prod', ['build:prod', 'express:prod', 'express-keepalive']);
  grunt.registerTask('build:dev', ['react', 'browserify', 'sass:dev', 'copy']);
  grunt.registerTask('dev', ['build:dev', 'express:dev', 'watch']);
  grunt.registerTask('default', ['dev']);
};
