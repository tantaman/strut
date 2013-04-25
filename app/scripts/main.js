require.config({
  paths: {
    libs: "../scripts/libs",

    jquery: "../scripts/libs/jQuery",
    lodash: "../scripts/libs/lodash",
    backbone: "../scripts/libs/backbone",
    css: "../scripts/libs/css",
    // text: "../scripts/libs/text",
    bootstrap: "../components/bootstrap/bootstrap",
    colorpicker: "../components/colorpicker/js/colorpicker",
    gradientPicker: "../components/gradient_picker/jquery.gradientPicker",
    // downloadify: "../components/downloadify/js/downloadify.min",
    // swfobject: "../components/downloadify/js/swfobject",
    lang: "../locales/lang",
    handlebars: '../scripts/libs/Handlebars',

    // build - rmap
    'strut/presentation_generator/bespoke': '../bundles/app/strut.presentation_generator.bespoke',
    'strut/deck': '../bundles/app/strut.deck',
    'strut/startup': '../bundles/app/strut.startup',
    'strut/editor': '../bundles/app/strut.editor',
    'strut/etch_extension': '../bundles/app/strut.etch_extension',
    'strut/exporter/zip/browser': '../bundles/app/strut.exporter.zip.browser',
    'strut/exporter': '../bundles/app/strut.exporter',
    'strut/exporter/json': '../bundles/app/strut.exporter.json',
    'strut/header': '../bundles/app/strut.header',
    'strut/importer': '../bundles/app/strut.importer',
    'strut/importer/json': '../bundles/app/strut.importer.json',
    'strut/presentation_generator/impress': '../bundles/app/strut.presentation_generator.impress',
    'strut/logo_button': '../bundles/app/strut.logo_button',
    'strut/presentation_generator': '../bundles/app/strut.presentation_generator',
    'strut/reveal_generator': '../bundles/app/strut.reveal_generator',
    'strut/slide_components': '../bundles/app/strut.slide_components',
    'strut/slide_editor': '../bundles/app/strut.slide_editor',
    'strut/slide_snapshot': '../bundles/app/strut.slide_snapshot',
    'strut/storage': '../bundles/app/strut.storage',
    'strut/well_context_buttons': '../bundles/app/strut.well_context_buttons',
    'strut/config': '../bundles/app/strut.config',
    'strut/transition_editor': '../bundles/app/strut.transition_editor',

    'tantaman/web/local_storage': '../bundles/common/tantaman.web.local_storage',
    'tantaman/web/remote_storage': '../bundles/common/tantaman.web.remote_storage',
    'tantaman/web/saver': '../bundles/common/tantaman.web.saver',
    'tantaman/web/storage': '../bundles/common/tantaman.web.storage',
    'tantaman/web/undo_support': '../bundles/common/tantaman.web.undo_support',
    'tantaman/web/interactions': '../bundles/common/tantaman.web.interactions',
    'tantaman/web/widgets': '../bundles/common/tantaman.web.widgets'
    // end build - rmap
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
    return ++this.z;
  }
};

// TODO: we'll have to make a more generic one that hooks into
// the storage providers...
window.clearPresentations = function() {
  var len = localStorage.length;
  for (var i = 0; i < len; ++i) {
    var key = localStorage.key(i);
    if (key && key.indexOf(".strut") != -1) {
      console.log('Removing: ' + key);
      localStorage.removeItem(key);
    }
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

if (window.location.href.indexOf("preview=true") != -1) {
  require(['../preview_export/scripts/impress', 'jquery'], function(impress, jquery) {
    window.jQuery = jquery;
    window.startPres = impress;
    window.$ = jquery;
  });
} else {
  require([
           'lang',
           'compiled-templates',
           'colorpicker',
           'strut/config/config',
           'features',
           './StrutLoader',
           'bootstrap'
          ],
  function(lang, empt, empty, config, registry, StrutLoader) {
      'use strict';
      var agent = window.navigator.userAgent;
      if (agent.indexOf('WebKit') >= 0)
          window.browserPrefix = "-webkit-"
      else if (agent.indexOf('Mozilla') >= 0)
          window.browserPrefix = "-moz-"
      else if (agent.indexOf('Microsoft') >= 0)
          window.browserPrefix = "-ms-"
      else
          window.browserPrefix = ""
          

      $.event.special.destroyed = {
        remove: function(o) {
            if (o.handler)
              o.handler();
        }
      };

      StrutLoader.start(registry, function(){}, function(){});

      $(window).unload(function() {
        localStorage.setItem('Strut_sessionMeta', JSON.stringify(window.sessionMeta));
      });
  });
}
