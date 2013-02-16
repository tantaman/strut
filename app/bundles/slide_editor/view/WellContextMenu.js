define(['libs/backbone',
		'./model/WellContextMenuModel'].
function(Backbone, Model) {
	'use strict';

	return Backbone.View.extend({
		initialize: function() {
			this.model = new Model();
			this._template = JST['bundles/slide_editor/WellContextMenu'];
		},

		render: function() {
			this.$el.html(this._template(this.model.get('contextButtons')));
		},

		constructor: function WellContextMenu() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});