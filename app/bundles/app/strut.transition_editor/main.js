define(['tantaman/web/widgets/ModeButton',
		'./model/OverviewModel',
		'./view/Overview',
		'./view/FreeFormTransitionEditorView',
		'./view/CannedTransitionsView'],
function(ModeButton, OverviewModel, Overview, FreeFormTransitionEditorView,
	CannedTransitionsView) {
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
				interfaces: 'strut.TransitionEditor'
			}, FreeFormTransitionEditorView);

			registry.register({
				interfaces: 'strut.TransitionEditor'
			}, CannedTransitionsView);

			// TODO: register the canned transitions and xy stepping.
		}
	};
});