
/*
@author Tantaman
*/


(function() {

  define(["./Component", "common/FileUtils"], function(Component, FileUtils) {
    return Component.extend({
      initialize: function() {
        Component.prototype.initialize.apply(this, arguments);
        return this.set("type", "WebFrame");
      },
      constructor: function WebFrame() {
			Component.prototype.constructor.apply(this, arguments);
		}
    });
  });

}).call(this);
