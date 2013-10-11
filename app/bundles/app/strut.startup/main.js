define(['strut/editor/EditorView',
        'strut/editor/EditorModel'],
function(EditorView, EditorModel) {
	var registry = null;
	var editorStartup = {
		run: function() {
			var model = new EditorModel(registry);
    		var editor = new EditorView({model: model, registry: registry});
    		editor.render();
    		$('body').append(editor.$el);
    		registry.register({
			interfaces: 'strut.editor.EditorModel'
		}, model);

    		if (sessionMeta.lastPresentation != null) {
    			// Load it up.
    			var storageInterface = registry.getBest('strut.StorageInterface');
    			storageInterface.load(sessionMeta.lastPresentation, function(pres, err) {
    				if (!err) {
    					model.importPresentation(pres);
    				} else {
    					console.log(err);
    					console.log(err.stack);
    				}
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
