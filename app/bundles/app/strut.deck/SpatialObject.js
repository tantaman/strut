define(['common/Calcium',
	'common/Math2'],
	function(Calcium, Math2) {
		'use strict';

		// TODO Add docs
		/**
		 * @class SpatialObject
		 * @augments Calcium.Model
		 * @augments Backbone.Model
		 */
		return Calcium.Model.extend({
			initialize: function() {

			},

			setInt: function(name, value) {
				if (typeof value === "string") {
					try {
						value = parseInt(value, 10);
					} catch (e) {
						return;
					}
				}
				this.set(name, Math.round(value));
			},

			setFloat: function(name, value, dec) {
				if (typeof value === "string") {
					try {
						value = parseFloat(value);
					} catch (e) {
						return;
					}
				}

				value = Math2.round(value, dec || 2);
				this.set(name, value);
			},

			constructor: function SpatialObject() {
				Calcium.Model.prototype.constructor.apply(this, arguments);
			}
		});
	});