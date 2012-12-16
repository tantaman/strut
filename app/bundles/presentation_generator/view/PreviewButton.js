define(['libs/backbone'],
function(Backbone, PreviewGeneratorModel) {
	return Backbone.View.extend({
		className: 'btn-group iconBtns',
		initialize: function() {
			this.generators = 
				this.options.editorModel.get('presentationGenerators');

			delete this.options.editorModel;

			this._template = JST['bundles/presentation_generator/templates/Button'];
		},

		render: function() {
			this.$el.html(this._template(this.generators.models));
			return this;
		}
	});
});