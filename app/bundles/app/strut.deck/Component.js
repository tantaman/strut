
/*
@author Matt Crinklaw-Vogt
*/
  define(["./SpatialObject"], function(SpatialObject) {
    var defaultScale, defaults;
    defaults = {
      x: config.slide.size.width / 3,
      y: config.slide.size.height / 3
    };

    defaultScale = {
      x: 1,
      y: 1
    };
    return SpatialObject.extend({
      initialize: function() {
        _.defaults(this.attributes, defaults);
        if (this.attributes.scale === undefined) {
          this.attributes.scale = {};
          return _.defaults(this.attributes.scale, defaultScale);
        }
      },

      customClasses: function(classes) {
        if (classes == null) {
          return this.get('customClasses');
        } else {
          this.set('customClasses', classes);
        }
      },
      
      dispose: function() {
        this.trigger("dispose", this);
        return this.off();
      },
      constructor: function Component() {
			SpatialObject.prototype.constructor.apply(this, arguments);
		}
    });
  });
