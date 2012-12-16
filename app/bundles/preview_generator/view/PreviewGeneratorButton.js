define(['libs/backbone',
		'../model/PreviewGeneratorModel'],
function(Backbone, PreviewGeneratorModel) {
	return Backbone.View.extend({
		className: 'btn-group iconBtns',
		initialize: function() {
			this.model = new PreviewGeneratorModel({editorModel: this.options.editorModel});
			delete this.options.editorModel;

			this._template = JST['bundles/preview_generator/templates/Button'];
		},

		render: function() {
			this.$el.html(this._template(this.model.attributes));
			return this;
		}
	});
});