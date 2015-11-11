define(['strut/deck/Component'],
	function(Component) {
		'use strict';

		/**
		 * @class Image
		 * @augments Component
		 */
		return Component.extend({
			initialize: function() {
				Component.prototype.initialize.apply(this, arguments);
				this.set('type', 'Chart');
			},

			constructor: function Chart(attrs) {
				Component.prototype.constructor.call(this, attrs);
			}
		});
	});