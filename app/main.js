requirejs( [ "config" ], function( require ) {

    requirejs( [
        "underscore",
        "jquery"
    ], function( _, $ ) {

        // We should use domains instead
        window.process.on( "uncaughtException", function( err ) {
            console.log( "Caught exception: " + err );
        } );

        $("i.out").text("YEEEAH!");
        console.log( "calculator ready!" );
    } );
} );