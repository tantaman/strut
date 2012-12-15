define(['bundles/slide_editor/model/SlideEditorModel',
		'bundles/slide_editor/view/SlideEditorView'],
function(SlideEditorModel, SlideEditorView) {
	var service = {
		createMode: function(editorModel) {
			var model = new SlideEditorModel(editorModel);

			return {
				view: new SlideEditorView({model: model}),
				model: model,
				id: 'slide-editor'
			};
		},

		createButton: function(editorModel) {
			return {render: function() {return {}}};
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