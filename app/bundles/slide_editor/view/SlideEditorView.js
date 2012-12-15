define(['libs/backbone'],
function(Backbone) {

	function ModeButton(registry) {
		registry.register('strut.ModeButton', this);

		this.$el = $(JST['bundles/slide_editor/templates/Button']());
		this.$el.click(function() {
			editorModel.set('activeMode', null);
		});
		this.el = this.$el[0];
	}

	ModeButton.prototype.render = function() {
		return this;
	}

	return Backbone.View.extend({
		initialize: function() {
			this._template = JST['bundles/slide_editor/templates/SlideEditor'];
			this._modeButton = new ModeButton(this.options.registry);
		},

		render: function() {
			this.$el.html(this._template());
			return this;
		}
	});
});