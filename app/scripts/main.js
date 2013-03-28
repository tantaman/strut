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
    bundles: "../bundles",
    lang: "../locales/en",
    handlebars: '../scripts/libs/Handlebars',

    // build - bundles
    'strut/deck': '../bundles/app/strut.deck',
    'strut/startup': '../bundles/app/strut.startup',
    'strut/editor': '../bundles/app/strut.editor',
    'strut/etch_extension': '../bundles/app/strut.etch_extension',
    'strut/header': '../bundles/app/strut.header',
    'strut/impress_generator': '../bundles/app/strut.impress_generator',
    'strut/logo_button': '../bundles/app/strut.logo_button',
    'strut/presentation_generator': '../bundles/app/strut.presentation_generator',
    'strut/reveal_generator': '../bundles/app/strut.reveal_generator',
    'strut/slide_components': '../bundles/app/strut.slide_components',
    'strut/slide_editor': '../bundles/app/strut.slide_editor',
    'strut/slide_snapshot': '../bundles/app/strut.slide_snapshot',
    'strut/well_context_buttons': '../bundles/app/strut.well_context_buttons',
    'strut/config': '../bundles/app/strut.config',
    'strut/transition_editor': '../bundles/app/strut.transition_editor',

    'tantaman/web/local_storage': '../bundles/common/tantaman.web.local_storage',
    'tantaman/web/remote_storage': '../bundles/common/tantaman.web.remote_storage',
    'tantaman/web/saver': '../bundles/common/tantaman.web.saver',
    'tantaman/web/storage': '../bundles/common/tantaman.web.storage',
    'tantaman/web/undo_support': '../bundles/common/tantaman.web.undo_support',
    'tantaman/web/widgets': '../bundles/common/tantaman.web.widgets'
    // end build - bundles

    // 'strut/config': 'bundles/app/strut.config',
    // 'com/tantaman/web/storage': 'bundles/runtime/com.tantaman.web.storage'
  },

  shim: {
    bootstrap: {
      deps: ["jquery"]
    },

    colorpicker: {
      deps: ["jquery"]
    },

    gradientPicker: {
      deps: ["jquery", "colorpicker"]
    },

    handlebars: {
      exports: "Handlebars"
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

window.log = function(msg) {
  if (log.enabled.log)
    console.log(msg);
};

log.enabled = {
  notice: true,
  err: true,
  log: true
};

log.err = function(msg) {
  if (log.enabeld.err)
    console.error(msg);
};

log.notice = function(msg) {
  if (log.enabled.notice)
    console.log(msg);
}

require([
         'compiled-templates',
         'colorpicker',
         'strut/config/config',
         'features',
         './StrutLoader',
         'bootstrap'
        ],
function(empt, empty, config, registry, StrutLoader) {
    'use strict';
    if ($.browser.mozilla)
        window.browserPrefix = "-moz-"
    else if ($.browser.msie)
        window.browserPrefix = "-ms-"
    else if ($.browser.opera)
        window.browserPrefix = "-o-"
    else if ($.browser.webkit)
        window.browserPrefix = "-webkit-"

    $.event.special.destroyed = {
      remove: function(o) {
          if (o.handler)
            o.handler();
      }
    };

    StrutLoader.start(registry, function(){}, function(){});
});
