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
    lang: "../locales/en",
    handlebars: '../scripts/libs/Handlebars'
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
         'bundles/strut_config/config',
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
