require.nodeRequire = window.requireNode;

requirejs.config({
  "paths": {
    "vendor": "../vendor",
    "almond": "../vendor/bower/almond/almond",
    "jquery": "../vendor/bower/jquery/dist/jquery",
    "jquery-ui": "../vendor/bower/jquery-ui/ui/jquery-ui",

    "underscore": "../vendor/bower/lodash/dist/lodash.underscore",

    // Require.js plugins
    "hbs": "../vendor/bower/require-handlebars-plugin/hbs"
  },

  "shim": {
    "underscore": {
      "exports": "_"
    },
    "jquery-ui": {
      "deps": ["jquery"],
      "exports": "$"
    }
  },

  "hbs": {
    "helpers": true,
    "i18n": false,
    "templateExtension": "hbs",
    "partialsUrl": "",
    "helperDirectory": "template/helpers/",
    "helperPathCallback": function(name) {
      return "templates/helpers/" + name;
    }
  }
});
