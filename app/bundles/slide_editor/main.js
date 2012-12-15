define(['bundles/slide_editor/model/SlideEditorModel',
		'bundles/slide_editor/view/SlideEditorView'],
function(SlideEditorModel, SlideEditorView) {
	function ModeButton(editorModel) {
		this.$el = $(JST['bundles/slide_editor/templates/Button']());
		this.$el.click(function() {
			editorModel.changeActiveMode('slide-editor');
		});
		this.el = this.$el[0];

		editorModel.on('change:activeMode', function(model, value) {
			if (model.get('modeId') == 'slide-editor') {
				this.$el.addClass('dispNone');
			} else {
				this.$el.removeClass('dispNone');
			}
		}, this);
	}

	ModeButton.prototype.render = function() {
		return this;
	}

	var service = {
		getMode: function(editorModel, registry) {
			var model = new SlideEditorModel(editorModel);

			return {
				view: new SlideEditorView({model: model}),
				model: model,
				id: 'slide-editor',
				close: function() {
					this.view.remove();
				}
			};
		},

		createButton: function(editorModel) {
			return new ModeButton(editorModel);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.EditMode',
				meta: {
					id: 'slide-editor'
				}
			}, service);
		}
	}
});