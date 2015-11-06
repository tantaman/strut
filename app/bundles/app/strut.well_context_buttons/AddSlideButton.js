define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		className: 'addBtn btn btn-plast',
		events: {
			click: "_addSlide"
		},

		_addSlide: function() {
			this._editorModel.addSlide(this._wellMenuModel.slideIndex());
		},

		render: function() {
			this.$el.html('<i class="fa fa-plus"></i>Slide');
			return this;
		},

		constructor: function AddSlideButton(editorModel, wellMenuModel) {
			this._editorModel = editorModel;
     		this._wellMenuModel = wellMenuModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});
