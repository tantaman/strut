define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		className: 'addBtn btn btn-success',
		events: {
			click: "_addSlide"
		},

		_addSlide: function() {
			this._editorModel.addSlide(this._wellMenuModel.slideIndex());
		},

		render: function() {
			this.$el.html('<center><i class="icon-plus icon-white"></i></center>');
			return this;
		},

		constructor: function AddSlideButton(editorModel, wellMenuModel) {
			this._editorModel = editorModel;
     		this._wellMenuModel = wellMenuModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});
