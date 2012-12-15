define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		initialize: function() {
			this._template = JST['bundles/slide_editor/templates/SlideEditor'];
		},

		remove: function() {
			Backbone.View.prototype.remove.call(this);
			this.model.dispose();
		},

		render: function() {
			this.$el.html(this._template());
			return this;
		}
	});
});