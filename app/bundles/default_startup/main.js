define(['bundles/editor/EditorView',
        'bundles/editor/EditorModel'],
function(EditorView, EditorModel) {
	var registry = null;
	var editorStartup = {
		run: function() {
			var model = new EditorModel(registry);
    		var editor = new EditorView({model: model, registry: registry});
    		editor.render();
    		$('body').append(editor.$el);

    		if (sessionMeta.lastPresentation != null) {
    			// Load it up.
    			var storageInterface = registry.getBest('Strut.StorageInterface');
    			storageInterface.load(sessionMeta.lastPresentation, function(pres, err) {
    				model.importPresentation(pres);
    			});
    		}
		}
	};

	var welcome = {
		run: function() {
			// If no previous presentation was detected, show the welcome screen.
		}
	};

	return {
		initialize: function(reg) {
			registry = reg;
			registry.register({
				interfaces: 'strut.StartupTask'
			}, editorStartup);

			registry.register({
				interfaces: 'strut.StartupTask'
			}, welcome);
		}
	};
});