define(['libs/backbone',
		'css!styles/slide_editor/operatingTable.css'],
function(Backbone, SlideSnapshot, empty) {
	'use strict';
	return Backbone.View.extend({
		className: 'operatingTable',

		constructor: function OperatingTable() {
			Backbone.View.prototype.constructor.call(this);
		}
	});
});