define(['strut/deck/Component',
	'common/FileUtils'],
	function(Component, FileUtils) {
		'use strict';

		/**
		 * @class WebFrame
		 * @extends Component
		 */
		return Component.extend({
			initialize: function() {
				Component.prototype.initialize.apply(this, arguments);
				this.set('type', 'WebFrame');
			},

			constructor: function WebFrame() {
				Component.prototype.constructor.apply(this, arguments);
			}
		});
	});