/**
 * @author Matt Crinklaw-Vogt
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

	/**
	 * Base class for all slide elements.
	 *
	 * @class Component
	 * @augments SpatialObject
	 */
	return SpatialObject.extend({

		/**
		 * Initialize component model.
		 * @returns {Object}
		 */
		initialize: function() {
			_.defaults(this.attributes, defaults);
			if (this.attributes.scale === undefined) {
				this.attributes.scale = {};
				return _.defaults(this.attributes.scale, defaultScale);
			}
		},

		/**
		 * Sets or returns custom classes of the element.
		 *
		 * @param {string} [classes] If passed, element will take these classes.
		 * @returns {string}
		 */
		customClasses: function(classes) {
			if (classes == null) {
				return this.get('customClasses');
			} else {
				this.set('customClasses', classes);
			}
		},
		
		/**
		 * Dispose the element.
		 */
		dispose: function() {
			this.trigger("dispose", this);
			this.off();
		},

		constructor: function Component() {
			SpatialObject.prototype.constructor.apply(this, arguments);
		}
	});
});
