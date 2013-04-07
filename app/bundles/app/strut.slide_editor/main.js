define(['strut/slide_editor/model/SlideEditorModel',
		'strut/slide_editor/view/SlideEditorView',
		'tantaman/web/widgets/ModeButton'],
function(SlideEditorModel, SlideEditorView, ModeButton) {
	var service = {
		getMode: function(editorModel, registry) {
			var model = new SlideEditorModel({editorModel: editorModel});

			return {
				view: new SlideEditorView({model: model, registry: registry}),
				model: model,
				id: 'slide-editor',
				close: function() {
					this.view.remove();
				}
			};
		},

		createButton: function(editorModel) {
			return new ModeButton(editorModel, 'slide-editor',
						JST['strut.slide_editor/Button']);
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