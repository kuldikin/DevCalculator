var rimraf = require( "rimraf" );
var fs = require( "fs-extra" );
var util = require( "util" );

util._extend( {
    encoding: "utf8",
    timeout: 0,
    maxBuffer: false,
    killSignal: "SIGTERM",
    cwd: null,
    env: null
} );

var parseBuildPlatforms = function( argumentPlatform ) {
    // this will make it build no platform when the platform option is specified
    // without a value which makes argumentPlatform into a boolean
    var inputPlatforms = argumentPlatform || process.platform + ";" + process.arch;
    // Do some scrubbing to make it easier to match in the regexes bellow
    inputPlatforms = inputPlatforms.replace( "darwin", "mac" );
    inputPlatforms = inputPlatforms.replace( /;ia|;x|;arm/, "" );
    var buildAll = /^all$/.test( inputPlatforms );
    var buildPlatforms = {
        mac: /mac/.test( inputPlatforms ) || buildAll,
        win: /win/.test( inputPlatforms ) || buildAll,
        linux32: /linux32/.test( inputPlatforms ) || buildAll,
        linux64: /linux64/.test( inputPlatforms ) || buildAll
    };
    return buildPlatforms;
};

module.exports = function( grunt ) {
    "use strict";

    var buildPlatforms = parseBuildPlatforms( grunt.option( "platforms" ) );
    var currentVersion = grunt.file.readJSON( "package.json" ).version;

    var packageJson = grunt.file.readJSON( "package.json" );
    var _VERSION = packageJson.version;

    grunt.log.writeln( "Building " + packageJson.version );

    grunt.initConfig( {
        // Wipe out previous builds and test reporting.
        clean: {
            all: [
                "build/dev-calculator-source",
                "build/releases/**",
                "node_modules",
                "vendor"
            ],
            some: [
                "build/dev-calculator-source",
                "build/releases/**"
            ]
        },

        handlebars: {
            compile: {
                options: {
                    amd: true,
                    namespace: "Templates",
                    partialsUseNamespace: true,
                    processName: function( filePath ) {
                        var file = filePath.replace( /.*\/(\w+)\.hbs/, "$1" );
                        return file;
                    }
                },
                files: {
                    "app/templates.js": [ "app/templates/*.hbs" ]
                }
            }
        },

        // Run your source code through JSHint"s defaults.
        jshint: {
            jshintrc: ".jshint",
            options: {
                smarttabs: true,
                proto: true,
                eqnull: true,
                quotmark: "double"
            },
            all: [
                "app/**/*.js",
                "!app/templates.js",
                "!app/lib/deps/**/*.js"
            ]
        },

        // This task uses James Burke"s excellent r.js AMD builder to take all
        // modules and concatenate them into a single file.
        requirejs: {
            release: {
                options: {
                    mainConfigFile: "app/config.js",
                    generateSourceMaps: false,
                    include: [ "main" ],
                    out: "build/dev-calculator-source/DevCalculator.js",
                    optimize: "uglify2",

                    // Since we bootstrap with nested `require` calls this option allows
                    // R.js to find them.
                    findNestedDependencies: true,

                    // Include a minimal AMD implementation shim.
                    name: "almond",

                    // Setting the base url to the distribution directory allows the
                    // Uglify minification process to correctly map paths for Source
                    // Maps.
                    baseUrl: "build/dev-calculator-source/app",

                    // Wrap everything in an IIFE.
                    wrap: true,

                    // Do not preserve any license comments when working with source
                    // maps.  These options are incompatible.
                    preserveLicenseComments: false
                }
            }
        },

        // This task simplifies working with CSS inside Backbone Boilerplate
        // projects.  Instead of manually specifying your stylesheets inside the
        // HTML, you can use `@imports` and this task will concatenate only those
        // paths.
        styles: {
            // Out the concatenated contents of the following styles into the below
            // development file path.
            "build/dev-calculator-source/DevCalculator.css": {
                // Point this to where your `index.css` file is location.
                src: "app/styles/index.css",

                // The relative path to use for the @imports.
                paths: [ "app/styles" ],

                // Rewrite image paths during release to be relative to the `img`
                // directory.
                // forceRelative: [ "/app/images/", "/app/fonts" ]
            }
        },

        // Minify the distribution CSS.
        cssmin: {
            release: {
                files: {
                    "build/dev-calculator-source/DevCalculator.css": [ "build/dev-calculator-source/DevCalculator.css" ]
                }
            }
        },

        //Process html files at build time to modify them depending on the release environment
        processhtml: {
            release: {
                files: {
                    "build/dev-calculator-source/index.html": [ "index.html" ]
                }
            }
        },

        // Move vendor and app logic during a build.
        copy: {
            release: {
                files: [ {
                    src: "package.json",
                    dest: "build/dev-calculator-source/package.json"
                }, {
                    src: [ "app/**" ],
                    dest: "build/dev-calculator-source/"
                }, {
                    src: "vendor/**",
                    dest: "build/dev-calculator-source/"
                }, {
                    src: "themes/**",
                    dest: "build/dev-calculator-source/"
                } ]
            }
        },

        compress: {
            release: {
                options: {
                    archive: "build/dev-calculator-source/DevCalculator.js.gz"
                },

                files: [ "build/dev-calculator-source/DevCalculator.js" ]
            }
        },

        nodewebkit: {
            options: {
                version: "0.11.5",
                appName: "DevCalculator",
                appVersion: "1.0.0.beta",
                buildDir: "./build",
                cacheDir: "./build/cache",
                platforms: [ "osx", "win", "linux32", "linux64" ],
                macIcns: "app/styles/images/logo/DevCalculator.icns",
                macCredits: "credits.html"
            },
            src: [
                "./build/dev-calculator-source/**/*"
            ]
        },

        exec: {
            win: {
                cmd: '"build/cache/<%= nodewebkit.options.version %>/win/nw.exe" .'
            },
            mac: {
                cmd: "build/cache/<%= nodewebkit.options.version %>/osx/node-webkit.app/Contents/MacOS/node-webkit ."
            },
            linux32: {
                cmd: "build/cache/<%= nodewebkit.options.version %>/linux32/nw ."
            },
            linux64: {
                cmd: "build/cache/<%= nodewebkit.options.version %>/linux64/nw ."
            },
            createDmg: {
                cmd: "dist/mac/yoursway-create-dmg/create-dmg --volname \"Komanda " + currentVersion + "\" --background ./dist/mac/background.png --window-size 480 540 --icon-size 128 --app-drop-link 240 370 --icon \"Komanda\" 240 110 ./build/releases/Komanda/osx/Komanda-" + currentVersion + "-Mac.dmg ./build/releases/Komanda/osx/"
            },
            createWinInstall: {
                cmd: "makensis dist/windows/installer.nsi"
            },
            createWinUpdate: {
                cmd: "makensis dist/windows/updater.nsi"
            }
        },

        shell: {
            npm: {
                options: {
                    stdout: false,
                    stderr: false,
                    stdin: false
                },
                command: "npm install"
            },
            runnw: {
                options: {
                    stdout: false,
                    stderr: false,
                    stdin: false
                },
                command: "./build/cache/<%= nodewebkit.options.version %>/osx/node-webkit.app/Contents/MacOS/node-webkit . > /dev/null 2>&1"
            },

            linux64: {
                options: {
                    stdout: false,
                    stderr: false,
                    stdin: false,
                },
                command: "./build/cache/<%= nodewebkit.options.version %>/linux64/nw ./build/dev-calculator-source/"
            },

            linux32: {
                options: {
                    stdout: false,
                    stderr: false,
                    stdin: false,
                },
                command: "./build/cache/<%= nodewebkit.options.version %>/linux32/nw ./build/dev-calculator-source/"
            },

            create_dmg: {
                options: {
                    stdout: true
                },
                command: "./dist/mac/yoursway-create-dmg/create-dmg --volname \"Komanda " + _VERSION + "\" --background ./dist/mac/background.png --window-size 480 540 --icon-size 128 --app-drop-link 240 370 --icon \"Komanda\" 240 110 ./build/releases/Komanda/osx/Komanda-" + _VERSION + ".dmg ./build/releases/Komanda/osx/"
            }
        },

        revision: {
            options: {
                property: "revision",
                ref: "HEAD",
                short: true
            }
        },

        replace: {
            revision: {
                options: {
                    patterns: [ {
                        match: "GIT_REVISION",
                        replacement: "<%= revision %>"
                    } ]
                },
                files: [ {
                    src: "build/dev-calculator-source/app/main.js",
                    dest: "build/dev-calculator-source/app/main.js"
                } ]
            }
        }
    } );

    grunt.registerTask( "cleanBuildDir", "remove unneeded files from the build dir.", function() {
        fs.mkdirSync( "build/dev-calculator-source/images" );
        fs.mkdirSync( "build/dev-calculator-source/fonts" );

        fs.copySync( "build/dev-calculator-source/app/styles/images", "build/dev-calculator-source/images" );
        fs.copySync( "build/dev-calculator-source/app/styles/fonts", "build/dev-calculator-source/fonts" );
        fs.copySync( "build/dev-calculator-source/vendor/bower/octicons/octicons", "build/dev-calculator-source/fonts/octicons/" );

        rimraf.sync( "build/dev-calculator-source/app", function( error ) {
            console.log( error );
        } );

        rimraf.sync( "build/dev-calculator-source/vendor", function( error ) {
            console.log( error );
        } );

    } );

    // Grunt contribution tasks.
    grunt.loadNpmTasks( "grunt-contrib-clean" );
    grunt.loadNpmTasks( "grunt-contrib-jshint" );
    grunt.loadNpmTasks( "grunt-contrib-cssmin" );
    grunt.loadNpmTasks( "grunt-contrib-copy" );
    grunt.loadNpmTasks( "grunt-contrib-compress" );

    // Third-party tasks.
    grunt.loadNpmTasks( "grunt-exec" );
    grunt.loadNpmTasks( "grunt-npm-install" );
    grunt.loadNpmTasks( "grunt-open" );
    grunt.loadNpmTasks( "grunt-node-webkit-builder" );
    grunt.loadNpmTasks( "grunt-processhtml" );
    grunt.loadNpmTasks( "grunt-contrib-handlebars" );
    grunt.loadNpmTasks( "grunt-contrib-requirejs" );
    grunt.loadNpmTasks("grunt-bbb-styles");
    grunt.loadNpmTasks( "grunt-shell" );
    grunt.loadNpmTasks( "grunt-git-revision" );
    grunt.loadNpmTasks( "grunt-replace" );

    grunt.registerTask( "default", [

    ] );

    grunt.registerTask( "build", function( platforms ) {
        var targetPlatforms = parseBuildPlatforms( platforms );
        // Overwrite initial nodewebkit.options.platforms array with the
        // platforms returned by parseBuildPlatforms
        var targetPlatformsArray = [];
        Object.keys( targetPlatforms ).forEach( function( target ) {
            if ( targetPlatforms[ target ] ) {
                // grunt-node-webkit-builder doesn't understand `mac`,
                // so map it to `osx` before adding it to the array
                if ( target === "mac" ) {
                    target = "osx";
                }
                targetPlatformsArray.push( target );
            }
        } );
        grunt.config.set( "nodewebkit.options.platforms", targetPlatformsArray );

        grunt.task.run( [
            "clean:some",
            //"npm-install",
            "jshint",
            "processhtml",
            "copy",
            "revision",
            "replace:revision",
            "requirejs",
            "styles",
            "cssmin",
            "cleanBuildDir",
            "nodewebkit"
        ] );
    } );

    grunt.registerTask( "run", function() {
        var start = parseBuildPlatforms();
        if ( start.win ) {
            grunt.task.run( "run:win" );
        } else if ( start.mac ) {
            grunt.task.run( "run:mac" );
        } else if ( start.linux32 ) {
            grunt.task.run( "run:linux32" );
        } else if ( start.linux64 ) {
            grunt.task.run( "run:linux64" );
        } else {
            grunt.log.writeln( "OS not supported." );
        }
    } );

    grunt.registerTask( "run:mac", [
        "default",
        "shell:runnw"
    ] );

    grunt.registerTask( "run:win", [
        "default",
        "exec:win"
    ] );

    grunt.registerTask( "run:linux32", [
        "default",
        "copy",
        "exec:linux32"
    ] );

    grunt.registerTask( "run:linux64", [
        "default",
        "copy",
        "exec:linux64"
    ] );
};