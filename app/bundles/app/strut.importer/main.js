define(['tantaman/web/widgets/MenuItem',
		'framework/ServiceCollection',
		'tantaman/web/widgets/HiddenOpen',
		'framework/Iterator',
		'lang'],
function(MenuItem, ServiceCollection, HiddenOpen, Iterator, lang) {
	'use strict';

	// Very boiler-platey.  Need to get
	// some dynamic dependency injection to declarative
	// wire all this type of stuff up
	var importerCollection = null;
	var hiddenOpen = new HiddenOpen();
	$('body').append(hiddenOpen.render().$el);

	function fileBrowserLauncher(editorModel) {
		// Launch the file browser
		// forward the file chosen event off to the various registered services...
		hiddenOpen.trigger(function(file) {
			fileChosen(file, editorModel);
		});
	}

	function fileChosen(file, editorModel) {
		var iter = new Iterator(importerCollection);

		function next() {
			if (iter.hasNext()) {
				iter.next().import(file, editorModel, next);
			}
		}

		next();
	}

	var menuProvider = {
		createMenuItems: function(editorModel) {
			return new MenuItem({ title: lang.import, handler: fileBrowserLauncher, model: editorModel});	
		}
	};

	return {
		initialize: function(registry) {
			importerCollection = new ServiceCollection(
					registry, 'strut.importer',
					ServiceCollection.toServiceConverter
				);

			registry.register({
				interfaces: 'strut.LogoMenuItemProvider'
			}, menuProvider);
		}
	};
});