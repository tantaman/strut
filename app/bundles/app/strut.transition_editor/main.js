define(['tantaman/web/widgets/ModeButton',
		'./model/OverviewModel',
		'./view/Overview',
		'./view/FreeFormTransitionEditorView'],
function(ModeButton, OverviewModel, Overview, FreeFormTransitionEditorView) {
	var service = {
		getMode: function(editorModel, registry) {
			var model = new OverviewModel(editorModel, registry);

			return {
				view: new Overview({model: model}),
				model: model,
				id: 'overview',
				close: function() {
					this.view.remove();
				}
			};
		},

		createButton: function(editorModel) {
			return new ModeButton(editorModel, 'overview',
					JST['strut.transition_editor/Button']);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.EditMode',
				meta: {
					id: 'overview'
				}
			}, service);

			registry.register({
				interfaces: 'strut.TransitionEditor',
				meta: {
					capabilities: {
						freeformStepping: true
					}
				}
			}, FreeFormTransitionEditorView);

			// TODO: register the canned transitions and xy stepping.
		}
	};
});