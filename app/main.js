requirejs( [ "config" ], function( require ) {

    requirejs( [
        "underscore",
        "jquery"
    ], function( _, $ ) {

        // We should use domains instead
        window.process.on( "uncaughtException", function( err ) {
            console.log( "Caught exception: " + err );
        } );

        var gui = requireNode( "nw.gui" );

        $( ".window-button.close" ).on( "click", function( e ) {
            e.preventDefault();
            gui.Window.get().close();
        } );

        $( ".window-button.minimize" ).on( "click", function( e ) {
            e.preventDefault();
            gui.Window.get().minimize();
        } );


        $( ".window-button.fullscreen" ).on( "click", function( e ) {
            if ( $( ".window-button.fullscreen" ).data( "is-maximized", false ) ) {
                gui.Window.get().toggleFullscreen();
            }
        } );

        $( ".window-button.debug" ).on( "click", function( e ) {
            gui.Window.get().showDevTools();
        } );

        $( ".window-button.reload" ).on( "click", function( e ) {
            gui.Window.get().reload();
        } );

    } );
} );