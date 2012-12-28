define(['libs/backbone',
		'css!styles/logo_button/logo.css'],
function(Backbone) {
	return Backbone.View.extend({
		className: 'logo-group btn-group',

		initialize: function() {
			this._template = JST['bundles/logo_button/templates/Logo'];
		},

		render: function() {
			this.$el.html(this._template());

			return this;
		}
	});
});