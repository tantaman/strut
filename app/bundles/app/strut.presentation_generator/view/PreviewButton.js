define(['libs/backbone', '../PreviewLauncher'],
function(Backbone, PreviewLauncher) {
	return Backbone.View.extend({
		className: 'btn-group iconBtns',
		events: {
			'click .act': '_launch'
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

		_bind: function() {
			var self = this;
			this.$el.find('li').each(function(i) {
				var $btn = $(this);
				$btn.click(function(e) {
					// self._previewLauncher.launch(self._generators[i]);
					self.$el.find('.check').css('visibility', 'hidden');
					$btn.find('.check').css('visibility', '');
					self._editorModel.set('generator', self._generators[i]);
					self.$el.find('.dropdown-toggle').dropdown('toggle');
					e.stopPropagation();
				});
			});
		},

		_generatorChanged: function() {
			if (this._$readout)
				this._$readout.text(this._editorModel.get('generator').displayName);
			this.$el.find('.check').css('visibility', 'hidden');
			this.$el.find('li[data-option="' + this._editorModel.get('generator').id + '"] .check').css('visibility', '');
		},

		render: function() {
			this.$el.html(this._template({generators: this._generators, chosen: this._editorModel.get('generator')}));
			this._bind();
			this._$readout = this.$el.find('.chosen');
			this.$el.find('li[data-option="' + this._editorModel.get('generator').id + '"] .check').css('visibility', '');
			return this;
		}
	});
});