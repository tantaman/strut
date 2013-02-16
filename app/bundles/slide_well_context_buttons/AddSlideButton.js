define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		className: 'addBtn btn btn-success',
		events: {
			click: "_addSlide"
		},

		_addSlide: function() {
			this._editorModel.addSlide();
		},

		render: function() {
			this.$el.html('<center><i class="icon-plus icon-white"></i></center>');
			return this;
		},

		constructor: function AddSlideButton(editorModel) {
			this._editorModel = editorModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});