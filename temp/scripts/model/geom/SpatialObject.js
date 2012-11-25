
/*
@author Matt Crinklaw-Vogt
*/


(function() {

  define(["common/Calcium", "common/Math2"], function(Backbone, Math2) {
    return Backbone.Model.extend({
      initialize: function() {},
      setInt: function(name, value) {
        if (typeof value === "string") {
          try {
            value = parseInt(value);
          } catch (e) {
            return;
          }
        }
        return this.set(name, Math.round(value));
      },
      setFloat: function(name, value, dec) {
        if (typeof value === "string") {
          try {
            value = parseInt(value);
          } catch (e) {
            return;
          }
        }
        dec || (dec = 2);
        value = Math2.round(value, dec);
        return this.set(name, value);
      },
      constructor: function SpatialObject() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}
    });
  });

}).call(this);
