define(['libs/backbone'],
function(Backbone, PreviewGeneratorModel) {
	return Backbone.View.extend({
		className: 'btn-group iconBtns',
		initialize: function() {
			this.generators = this.options.editorModel.registry
				.getBest('strut.presentation_generator.GeneratorCollection');

			delete this.options.editorModel;

			this._template = JST['strut.presentation_generator/Button'];
		},

		render: function() {
			this.$el.html(this._template({generators: this.generators}));
			return this;
		}
	});
});