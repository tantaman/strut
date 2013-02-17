define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		tagName: 'li',
		constructor: function SaveMenuItem(modal, editorModel) {
			Backbone.View.prototype.constructor.call(this);
		},

		render: function() {
			this.$el.html('<a>Save</a>');
			return this;
		}
	});
});