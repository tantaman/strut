define([],
function() {
	var service = {
		createMode: function(editorModel) {
			var model = new SlideEditModel(editorModel);

			return {
				view: new SlideEditView({model: model}),
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