define(['libs/backbone',
		'./LogoModel',
		'css!styles/logo_button/logo.css'],
function(Backbone, LogoModel) {
	'use strict';
	return Backbone.View.extend({
		className: 'logo-group btn-group',

		initialize: function() {
			this._template = JST['bundles/logo_button/templates/Logo'];
			this.model = new LogoModel(this.options.editorModel);
			delete this.options.editorModel;
		},

		render: function() {
			this.$el.html(this._template());

			return this;
		},

		constructor: function LogoView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});