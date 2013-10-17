define(['strut/editor/EditorView',
        'strut/editor/EditorModel',
        'lls'],
function(EditorView, EditorModel, lls) {
	var registry = null;


	function restoreLastPresentation(model) {
		// var exitsaveData = localStorage.getItem('strut-exitsave');
		// if (exitsaveData) {
		// 	var lastPres = JSON.parse(exitsaveData);
		// 	restoreExitSave(lastPres);
		// }


		if (sessionMeta.lastPresentation != null) {
			// Load it up.
			var storageInterface = registry.getBest('strut.StorageInterface');
			storageInterface.load(sessionMeta.lastPresentation).then(function(pres) {
				model.importPresentation(pres);
			}).catch(function(err) {
				console.log(err);
				console.log(err.stack);
			});
		}
	}

	function restoreExitSave(exitSavedPres) {
		// if (window.sessionMeta.lastPresentation == lastPres.identifier) {

		// }
	}

	function initializeStorage() {
		// TODO: should we force our provider
		// to whatever the user used last?
		var storage = new lls({size: 75 * 1024 * 1024, name: 'strut'});

		// TODO: some sort of spinner or loading indication
		// while we get the storage interface ready.

		// TODO: move this into strut.startup
		storage.initialized.then(function(capacity) {
			// Register LLS with the registry?
			storage.name = "Local";
			storage.id = "largelocalstorage";
			storage.ready = function() { return true; };
			storage.bg = function() {};

			registry.register({
				interfaces: 'tantaman.web.StorageProvider'
			}, storage);

			if (window.__requiresStorageConversion) {
				// convert and delete past presentations
				console.log('Requires conversion');
			}
		});

		return storage.initialized;
	}

	function loadEditor() {
		var model = new EditorModel(registry);
    	var editor = new EditorView({model: model, registry: registry});
    	editor.render();
    	$('body').append(editor.$el);
    	return model;
	}

	var editorStartup = {
		run: function() {
			// TODO: refactor so we can load the editor
			// while we load the storage interface
    		initializeStorage().then(function() {
    			var model = loadEditor();
    			restoreLastPresentation(model);
    		}, function(err) {
				// Just continue with LocalStorage?
				// fail?
				console.error(err);
			});
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