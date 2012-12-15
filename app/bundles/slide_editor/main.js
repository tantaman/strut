define(['bundles/slide_editor/model/SlideEditorModel',
		'bundles/slide_editor/view/SlideEditorView'],
function(SlideEditorModel, SlideEditorView) {
	var service = {
		createMode: function(editorModel, registry) {
			var model = new SlideEditorModel(editorModel);

			return {
				view: new SlideEditorView({model: model, registry: registry}),
				model: model,
				id: 'slide-editor'
			};
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