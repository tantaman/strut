define(['bundles/widgets/ModeButton',
		'bundles/transition_editor/model/TransitionEditorModel',
		'bundles/transition_editor/view/TransitionEditorView'],
function(ModeButton, TransitionEditorModel, TransitionEditorView) {
	var service = {
		getMode: function(editorModel, registry) {
			var model = new TransitionEditorModel(editorModel);

			return {
				view: new TransitionEditorView(),
				model: model,
				id: 'transition-editor',
				close: function() {
					this.view.remove();
				}
			};
		},

		createButton: function(editorModel) {
			return new ModeButton(editorModel, 'transition-editor',
					JST['bundles/transition_editor/templates/Button']);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.EditMode',
				meta: {
					id: 'transition-editor'
				}
			}, service);
		}
	};
});