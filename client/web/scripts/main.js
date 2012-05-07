/*
@author Tantaman
*/
var continuation;

requirejs.config({
  "packages": ["ui/editor", "model/presentation"],
  paths: {
    "css": "vendor/amd_plugins/css",
    "text": "vendor/amd_plugins/text"
  }
});

window.browserPrefix = "";

if ($.browser.mozilla) {
  window.browserPrefix = "-moz-";
} else if ($.browser.msie) {
  window.browserPrefix = "-ms-";
} else if ($.browser.opera) {
  window.browserPrefix = "-o-";
} else if ($.browser.webkit) {
  window.browserPrefix = "-webkit-";
}

requirejs(["vendor/backbone", "state/DefaultState"], function(Backbone, DefaultState) {
  Backbone.sync = function(method, model, options) {
    if (options.keyTrail != null) {
      return options.success(DefaultState.get(options.keyTrail));
    }
  };
  return continuation();
});

continuation = function() {
  return requirejs(["ui/editor", "model/presentation"], function(Editor, presentation) {
    var deck, editor;
    deck = new presentation.Deck();
    editor = new Editor({
      model: deck
    });
    $("body").append(editor.render());
    return deck.newSlide();
  });
};
