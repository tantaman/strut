define(['bundles/slide_editor/model/SlideEditorModel',
		'bundles/slide_editor/view/SlideEditorView',
		'bundles/widgets/ModeButton'],
function(SlideEditorModel, SlideEditorView, ModeButton) {
	var service = {
		getMode: function(editorModel, registry) {
			var model = new SlideEditorModel({editorModel: editorModel});

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
			return new ModeButton(editorModel, 'slide-editor',
						JST['bundles/slide_editor/templates/Button']);
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
	};
});