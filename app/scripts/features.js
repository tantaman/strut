define([
	'framework/ServiceRegistry',
	'bundles/etch_extension/main',
	'bundles/slide_editor/main',
	'bundles/transition_editor/main',
	'bundles/slide_components/main',
	'bundles/slide_well_context_buttons/main',
	'bundles/local_storage/main',
	'bundles/storage/main',
	'bundles/default_startup/main',
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
		LocalStorage,
		DefaultStartup) {
	var registry = new ServiceRegistry();

	SlideEditorBundle.initialize(registry);
	TransitionEditorBundle.initialize(registry);
	SlideComponents.initialize(registry);
	SlideWellContextButtons.initialize(registry);
	Storage.initialize(registry);
	LocalStorage.initialize(registry);
	DefaultStartup.initialize(registry);

	return registry;
});