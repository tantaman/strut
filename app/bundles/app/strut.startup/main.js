define(['strut/editor/EditorView',
        'strut/editor/EditorModel',
        'lls'],
function(EditorView, EditorModel, lls) {
	var registry = null;


	function restoreLastPresentation(model) {
		var storageInterface = registry.getBest('strut.StorageInterface');
		var exitsaveData = localStorage.getItem('strut-exitsave');
		var restorePromise;
		if (exitsaveData && exitsaveData !== '') {
			var exitSavedPres = JSON.parse(exitsaveData);
			restorePromise = restoreExitSave(exitSavedPres, exitsaveData, storageInterface);
		}

		if (restorePromise) {
			restorePromise.then(function() {
				importPresentation(exitSavedPres);
			}, function(err) {
				loadPresentation();
			}).done();
		} else {
			loadPresentation();
		}

		function loadPresentation() {
			if (sessionMeta.lastPresentation != null) {
				storageInterface.load(sessionMeta.lastPresentation).then(importPresentation)
				.catch(function(err) {
					console.log(err);
					console.log(err.stack);
				});
			}
		}

		function importPresentation(pres) {
			model.importPresentation(pres);
		}
	}

	function restoreExitSave(exitSavedPres, exitsaveData, storage) {
		var promise = storage.store(exitSavedPres.fileName, exitsaveData, {json: false});
		localStorage.setItem('strut-exitsave', '');
		return promise;
	}

	function initializeStorage() {
		console.log('Initializing storage');
		// TODO: should we force our provider
		// to whatever the user used last?
		var storage = new lls({size: 75 * 1024 * 1024, name: 'strut'});

		// TODO: some sort of spinner or loading indication
		// while we get the storage interface ready.

		storage.initialized.then(function(capacity) {
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
			var model;
    		initializeStorage().then(function() {
    			restoreLastPresentation(model);
				$(window).unload(function() {
					localStorage.setItem('Strut_sessionMeta', JSON.stringify(window.sessionMeta));
				});
    		}, function(err) {
				// Just continue with LocalStorage?
				// fail?
				console.error(err);
			}).done();

			model = loadEditor();
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