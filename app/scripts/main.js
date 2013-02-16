require.config({
  paths: {
    libs: "../scripts/libs",

    jquery: "../scripts/libs/jQuery",
    lodash: "../scripts/libs/lodash",
    backbone: "../scripts/libs/backbone",
    css: "../scripts/libs/css",
    text: "../scripts/libs/text",
    bootstrap: "../components/bootstrap/bootstrap",
    colorpicker: "../components/colorpicker/js/colorpicker",
    gradientPicker: "../components/gradient_picker/jquery.gradientPicker",
    downloadify: "../components/downloadify/js/downloadify.min",
    swfobject: "../components/downloadify/js/swfobject",
    jqueryUI: "../scripts/libs/jqueryUI",
    bundles: "../bundles",
    lang: "../locales/en"
  },

  shim: {
    bootstrap: {
      deps: ["jquery"]
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

var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

window.__extends = __extends;

window.zTracker = {
  z: 0,
  next: function() {
    ++this.z;
  }
};

require([
         'colorpicker',
         'bundles/strut_config/config',
         'features',
         'bundles/editor/EditorView',
         'bundles/editor/EditorModel',
         'libs/Handlebars',
         'bootstrap'
        ],
function(empty, config, registry, EditorView, EditorModel, Handlebars) {
    'use strict';
    if ($.browser.mozilla)
        window.browserPrefix = "-moz-"
    else if ($.browser.msie)
        window.browserPrefix = "-ms-"
    else if ($.browser.opera)
        window.browserPrefix = "-o-"
    else if ($.browser.webkit)
        window.browserPrefix = "-webkit-"

    for (var tpl in JST) {
        JST[tpl] = Handlebars.template(JST[tpl]);
    }

    (function($) {
      jQuery.event.special.destroyed = {
          remove: function(o) {
              if (o.handler)
                  o.handler();
          }
      };
    })(jQuery);

    var model = new EditorModel(registry);
    window.config = config;

  // TODO: the model will need to tell us when it is set to go
  // since there may be some awkward handshaking going on with storage
  // providers

    var editor = new EditorView({model: model, registry: registry});

    editor.render();

    $('body').append(editor.$el);
});