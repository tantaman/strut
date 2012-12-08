require.config({
  paths: {
    libs: "../scripts/libs",

    jquery: "../scripts/libs/jQuery",
    lodash: "../scripts/libs/lodash",
    backbone: "../scripts/libs/backbone",
    css: "../scripts/libs/css",
    text: "../scripts/libs/text",
    bootstrap: "../components/bootstrap/bootstrap",
    bootstrapDropdown: "../components/bootstrap/bootstrapDropdown",
    colorpicker: "../components/colorpicker/js/colorpicker",
    gradientPicker: "../components/gradient_picker/jquery.gradientPicker",
    downloadify: "../components/downloadify/js/downloadify.min",
    swfobject: "../components/downloadify/js/swfobject",
    jqueryUI: "../scripts/libs/jqueryUI",
    bundles: "../bundles"
  },

  shim: {
    bootstrap: {
      deps: ["jquery"]
    },

    bootstrapDropdown: {
      deps: ["bootstrap", "jquery"]
    },

    jqueryUI: {
      deps: ["jquery"]
    },

    colorpicker: {
      deps: ["jquery"]
    },

    gradientPicker: {
      deps: ["jquery", "colorpicker"]
    },

    "../preview_export/scripts/impress": {
      exports: "startImpress"
    }
  }
});

require(['features', 'bundles/editor/main'], function(empty, Editor) {
	Editor.start();
});