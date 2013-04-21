(function() {
  var continuation;

  require.config({
    paths: {
      libs: "../scripts/libs",
      plugins: "../scripts/plugins",
      jquery: "../scripts/libs/jQuery",
      lodash: "../scripts/libs/lodash",
      backbone: "../scripts/libs/backbone",
      css: "../scripts/plugins/css",
      text: "../scripts/plugins/text",
      bootstrap: "../components/bootstrap/bootstrap",
      bootstrapDropdown: "../components/bootstrap/bootstrapDropdown",
      colorpicker: "../components/colorpicker/js/colorpicker",
      gradientPicker: "../components/gradient_picker/jquery.gradientPicker",
      downloadify: "../components/downloadify/js/downloadify.min",
      swfobject: "../components/downloadify/js/swfobject",
      jqueryUI: "../scripts/libs/jqueryUI"
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

  window.browserPrefix = "";

  window.URL = window.webkitURL || window.URL;

  window.Blob = window.Blob || window.WebKitBlob || window.MozBlob;

  if (!(window.localStorage != null)) {
    window.localStorage = {
      setItem: function() {},
      getItem: function() {},
      length: 0
    };
  }

  if (window.location.href.indexOf("preview=true") !== -1) {
    requirejs(["../preview_export/scripts/impress", "jquery"], function(impress, jquery) {
      window.jQuery = jquery;
      window.startImpress = impress;
      return window.$ = jquery;
    });
  } else {
    continuation = function() {
      return requirejs(["ui/editor/Editor", "model/presentation/Deck", "storage/FileStorage", "model/common_application/UndoHistory"], function(Editor, Deck, FileStorage, UndoHistory) {
        var deck, editor, lastPres, pres;
        window.undoHistory = new UndoHistory(20);
        deck = new Deck();
        editor = new Editor({
          model: deck
        });
        window.zTracker = {
          z: 0,
          next: function() {
            return ++this.z;
          }
        };
        $("body").append(editor.render());
        lastPres = localStorage.getItem("StrutLastPres");
        if (lastPres != null) {
          pres = FileStorage.open(lastPres);
          if (pres != null) {
            deck["import"](pres);
          }
        }
        if (!(lastPres != null)) {
          return deck.newSlide();
        }
      });
    };
    requirejs(["backbone", "state/DefaultState", "libs/etch", "jquery", "libs/Handlebars", "jqueryUI", "bootstrap", "bootstrapDropdown", "colorpicker", "gradientPicker", "downloadify", "swfobject", "css!styles/etch/etchOverrides.css"], function(Backbone, DefaultState, etch, $, Handlebars) {
      var func, tpl;
      window.Handlebars = Handlebars;
      for (tpl in JST) {
        func = JST[tpl];
        JST[tpl] = Handlebars.template(func);
      }
      Backbone.sync = function(method, model, options) {
        if (options.keyTrail != null) {
          return options.success(DefaultState.get(options.keyTrail));
        }
      };
      if ($.browser.mozilla) {
        window.browserPrefix = "-moz-";
      } else if ($.browser.msie) {
        window.browserPrefix = "-ms-";
      } else if ($.browser.opera) {
        window.browserPrefix = "-o-";
      } else if ($.browser.webkit) {
        window.browserPrefix = "-webkit-";
      }
      $.fn.selectText = function() {
        var doc, element, range, selection;
        doc = document;
        element = this[0];
        if (doc.body.createTextRange) {
          range = document.body.createTextRange();
          range.moveToElementText(element);
          range.select();
        } else if (window.getSelection) {
          selection = window.getSelection();
          range = document.createRange();
          range.selectNodeContents(element);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        return this;
      };
      window.slideConfig = {
        size: {
          width: 1024,
          height: 768
        }
      };
      _.extend(etch.config.buttonClasses, {
        "default": ['<group>', 'bold', 'italic', '</group>', '<group>', 'unordered-list', 'ordered-list', '</group>', '<group>', 'justify-left', 'justify-center', '</group>', '<group>', 'link', '</group>', 'font-family', 'font-size', '<group>', 'color', '</group>']
      });
      etch.buttonElFactory = function(button) {
        var viewData;
        viewData = {
          button: button,
          title: button.replace('-', ' '),
          display: button.substring(0, 1).toUpperCase()
        };
        if (button === 'link' || button === 'clear-formatting' || button === 'ordered-list' || button === 'unordered-list') {
          viewData.display = '';
        }
        switch (button) {
          case "font-size":
            return JST["etch/fontSizeSelection"](viewData);
          case "font-family":
            return JST["etch/fontFamilySelection"](viewData);
          case "color":
            return JST["etch/colorChooser"](viewData);
          default:
            if (button.indexOf("justify") !== -1) {
              viewData.icon = button.substring(button.indexOf('-') + 1, button.length);
              return JST["etch/align"](viewData);
            } else {
              return JST["etch/defaultButton"](viewData);
            }
        }
      };
      etch.groupElFactory = function() {
        return $('<div class="btn-group">');
      };
      return continuation();
    });
  }

}).call(this);
