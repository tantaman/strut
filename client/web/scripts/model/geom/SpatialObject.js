/*
@author Matt Crinklaw-Vogt
*/
define(["vendor/backbone"], function(Backbone) {
  return Backbone.Model.extend({
    initialize: function() {},
    constructor: function SpatialObject() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}
  });
});
