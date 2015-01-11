requirejs( [ "config" ], function( require ) {

    requirejs( [
        "underscore",
        "jquery",
        "app"
    ], function( _, $, Calculator ) {

        Calculator.gui = requireNode( "nw.gui" );
        Calculator.window = Calculator.gui.Window.get();

        window.process.on( "uncaughtException", function( err ) {
            console.log( "Caught exception: " + err );
        } );

        $( ".window-button.close" ).on( "click", function( e ) {
            e.preventDefault();
            Calculator.window.close();
        } );

        $( ".window-button.minimize" ).on( "click", function( e ) {
            e.preventDefault();
            Calculator.window.minimize();
        } );


        $( ".window-button.fullscreen" ).on( "click", function( e ) {
            if ( $( ".window-button.fullscreen" ).data( "is-maximized", false ) ) {
                Calculator.window.toggleFullscreen();
            }
        } );

        $( ".window-button.debug" ).on( "click", function( e ) {
            Calculator.window.showDevTools();
        } );

        $( ".window-button.reload" ).on( "click", function( e ) {
            Calculator.window.reload();
        } );

        Calculator.window.on( "blur", function() {
            Calculator.blur = true;
            $( "body" ).addClass( "blur" );
        } );

        Calculator.window.on( "focus", function() {
            Calculator.blur = false;
            $( "body" ).removeClass( "blur" );
        } );

        // Create default menus in OSX for copy/paste support.
        // https://github.com/rogerwang/node-webkit/wiki/Menu#menucreatemacbuiltinappname
        if ( requireNode( "os" ).platform() === "darwin" ) {
            var mb = new Calculator.gui.Menu( {
                type: "menubar"
            } );
            if ( mb.createMacBuiltin ) {
                mb.createMacBuiltin( "DevCalculator" );

                // Add default OSX Preferences menu item and key binding
                mb.items[ 0 ].submenu.insert( new Calculator.gui.MenuItem( {
                    type: "separator"
                } ), 2 );
                mb.items[ 0 ].submenu.insert( new Calculator.gui.MenuItem( {
                    type: "normal",
                    label: "Preferences",
                    key: ",",
                    modifiers: "cmd",
                    click: function() {
                        
                    }
                } ), 2 );

                Calculator.window.menu = mb;
            }
        }

    } );
} );