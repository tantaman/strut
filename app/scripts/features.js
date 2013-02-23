define([
	'framework/ServiceRegistry',
	'bundles/etch_extension/main',
	'bundles/slide_editor/main',
	'bundles/transition_editor/main',
	'bundles/slide_components/main',
	'bundles/slide_well_context_buttons/main',
	'bundles/storage/main',
	'bundles/local_storage/main'
	// 'bundles/dropbox/main',
	// 'bundles/remote_storage/main'
	],
function(ServiceRegistry,
		EtchExtension,
		SlideEditorBundle,
		TransitionEditorBundle,
		SlideComponents,
		SlideWellContextButtons,
		Storage,
		LocalStorage) {
	var registry = new ServiceRegistry();

	SlideEditorBundle.initialize(registry);
	TransitionEditorBundle.initialize(registry);
	SlideComponents.initialize(registry);
	SlideWellContextButtons.initialize(registry);
	Storage.initialize(registry);
	LocalStorage.initialize(registry);

	return registry;
});