define(['libs/backbone'],
function(Backbone) {
	'use strict';
	return Backbone.View.extend({
		className: 'btn btn-plast',
		tagName: 'a',

		events: {
			'click': '_clicked'
		},

		initialize: function() {
			this._template = JST['bundles/slide_components/templates/ComponentButton']
		},

		_clicked: function() {
			this.options.editorModel.createComponent(this.options.componentType);
		},

		render: function() {
			this.$el.html('<i class="' + this.options.icon + ' icon-white"></i>' + this.options.name);
			return this;
		},

		constructor: function ComponentButton() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});