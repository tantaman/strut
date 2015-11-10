define(['strut/deck/Component',
	'common/FileUtils'],
	function(Component, FileUtils) {
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

			_updateCache: function() {
			},

			toBase64: function() {

			},

			constructor: function ChartModel(attrs) {
				Component.prototype.constructor.call(this, attrs);
			}
		});
	});