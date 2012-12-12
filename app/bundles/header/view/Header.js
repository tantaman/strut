define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		initialize: function() {
			this._template = JST['bundles/header/templates/Header'];
		},

		render: function() {
			this.$el.html(this._template());

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