define(['libs/backbone', '../PreviewLauncher'],
function(Backbone, PreviewLauncher) {
	return Backbone.View.extend({
		className: 'btn-group iconBtns',
		events: {
			click: '_launchDefault'
		},

		initialize: function() {
			this._editorModel = this.options.editorModel;
			this._previewLauncher = new PreviewLauncher(this._editorModel);
			this._generators = this._editorModel.registry
				.getBest('strut.presentation_generator.GeneratorCollection');

			delete this.options.editorModel;

			this._template = JST['strut.presentation_generator/Button'];
		},

		_launchDefault: function() {
			this._previewLauncher.launch(this._generators[0]);
		},

		_bind: function() {
			var self = this;
			this.$el.find('li').each(function(i) {
				var $btn = $(this);
				$btn.click(function(e) {
					self._previewLauncher.launch(self._generators[i]);
					e.stopPropagation();
				});
			});
		},

		render: function() {
			this.$el.html(this._template({generators: this._generators}));
			this._bind();
			return this;
		}
	});
});