define([
	'framework/ServiceRegistry',
	'bundles/etch_extension/main',
	'bundles/slide_editor/main',
	'bundles/transition_editor/main',
	'bundles/slide_components/main',
	'bundles/slide_well_context_buttons/main'
	// 'bundles/local_storage',
	// 'bundles/dropbox',
	// 'bundles/remote_storage'
	],
function(ServiceRegistry,
		EtchExtension,
		SlideEditorBundle,
		TransitionEditorBundle,
		SlideComponents,
		SlideWellContextButtons) {
	var registry = new ServiceRegistry();

	SlideEditorBundle.initialize(registry);
	TransitionEditorBundle.initialize(registry);
	SlideComponents.initialize(registry);
	SlideWellContextButtons.initialize(registry);

	return registry;
});