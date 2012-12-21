define(['./Component'],
function() {
	'use strict';
	return Component.extend({
		initialize: function() {
			Component.prototype.initialize.apply(this, arguments);
			this.set('type', 'TextBox');
			if (!this.get('text'))
				this.set('text', 'Text');
		},

		constructor: function TextBox() {
			Component.prototype.constructor.apply(this, arguments);
		}
	});
});