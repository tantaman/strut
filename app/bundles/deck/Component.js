define(['./SpatialObject'],
function(SpatialObject) {
	'use strict';
	var config = window.config;
	var defaults = {
		x: config.slide.size.width / 3,
		y: config.slide.size.height / 3
	};

	var defaultScale = {
		x: 1,
		y: 1
	};

// TODO: move rotation handling code here?
	return SpatialObject.extend({
		initialize: function() {
			_.defaults(this.attributes, defaults);
			if (!this.attributes.scale) {
				this.attributes.scale = {};
				_.defaults(this.attributes.scale, defaultScale);
			}
		},

		dispose: function() {
			this.trigger('dispose', this);
			this.off();
		},

		constructor: function Component() {
			SpatialObject.prototype.constructor.apply(this, arguments);
		}
	});
});