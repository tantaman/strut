define(['tantaman/web/widgets/ModeButton',
		'strut/transition_editor/model/TransitionEditorModel',
		'strut/transition_editor/view/TransitionEditorView'],
function(ModeButton, TransitionEditorModel, TransitionEditorView) {
	var service = {
		getMode: function(editorModel, registry) {
			var model = new TransitionEditorModel(editorModel, registry);

			return {
				view: new TransitionEditorView({model: model}),
				model: model,
				id: 'transition-editor',
				close: function() {
					this.view.remove();
				}
			};
		},

		createButton: function(editorModel) {
			return new ModeButton(editorModel, 'transition-editor',
					JST['transition_editor/Button']);
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