define(['strut/deck/Component'],
function(Component) {
	'use strict';

	return Component.extend({
		initialize: function() {
			Component.prototype.initialize.apply(this, arguments);
			this.set('type', 'Shape');
		},

		constructor: function Shape(attrs) {
			Component.prototype.constructor.call(this, attrs);
		}
	});
});