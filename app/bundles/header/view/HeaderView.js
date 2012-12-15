define(['libs/backbone',
		'bundles/logo_button/view/LogoView',
		'css!styles/header/header.css'],
function(Backbone, LogoView, empty) {
	return Backbone.View.extend({
		className: 'navbar navbar-inverse navbar-fixed-top',

		initialize: function() {
			this._template = JST['bundles/header/templates/Header'];
			this._logoButton = new LogoView();
		},

		render: function() {
			this.$el.html(this._template());

			this.$el.find('.logo-holder').append(this._logoButton.render().$el);

			var $modeButtons = this.$el.find('.mode-buttons');
			this.model.get('modeButtons').forEach(function(button) {
				$modeButtons.append(button.render().el);
			}, this);

			var $createCompButtons = this.$el.find('.create-comp-buttons');
			this.model.get('createCompButtons').forEach(function(button) {
				$createCompButtons.append(button.render().el);
			}, this);

			return this;
		},

		constructor: function HeaderView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});