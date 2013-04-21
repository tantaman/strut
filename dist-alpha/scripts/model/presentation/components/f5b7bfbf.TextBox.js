
/*
@author Tantaman
*/


(function() {

  define(["./Component"], function(Component) {
    return Component.extend({
      initialize: function() {
        Component.prototype.initialize.apply(this, arguments);
        this.set("type", "TextBox");
        if (!(this.get("text") != null)) {
          return this.set("text", "Text");
        }
      },
      textWithBreaks: function() {},
      constructor: function TextBox() {
			Component.prototype.constructor.apply(this, arguments);
		}
    });
  });

}).call(this);
