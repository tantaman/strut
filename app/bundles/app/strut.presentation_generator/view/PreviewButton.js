define(['libs/backbone', '../PreviewLauncher'],
function(Backbone, PreviewLauncher) {
	return Backbone.View.extend({
		className: 'btn-group iconBtns',
		events: {
			'click .act': '_launch',
			'click .option': '_launchOption'
		},

		initialize: function() {
			this._editorModel = this.options.editorModel;
			this._previewLauncher = new PreviewLauncher(this._editorModel);
			this._generators = this._editorModel.registry
				.getBest('strut.presentation_generator.GeneratorCollection');

			delete this.options.editorModel;
			this._editorModel.deck().on('change:cannedTransition', this._cannedTransitionChanged, this);
			this._editorModel.on('change:generator', this._generatorChanged, this);

			this._editorModel.set('generator', this._generators[0]);

			this._template = JST['strut.presentation_generator/Button'];
		},

		_cannedTransitionChanged: function() {
			this._generators.some(function(generator) {
				if(generator.capabilities && generator.capabilities.transitions.includes(this._editorModel.cannedTransition())) {
					this._editorModel.set('generator', generator);
					return true;
				}
			}, this);
		},

		_launch: function() {
			this._previewLauncher.launch(this._editorModel.get('generator'));
		},

		_launchOption: function(evt) {
			this._generators.some(function(generator) {
				if(generator.id === evt.currentTarget.dataset.option) {
					this._previewLauncher.launch(generator);
					return true;
				}
			}, this);
			this.$el.find('.dropdown-toggle').dropdown('toggle');
		},

		render: function() {
			this.$el.html(this._template(this._generators));
			return this;
		}
	});
});