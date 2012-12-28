define([
	'framework/ServiceRegistry',
	'bundles/etch_extension/main',
	'bundles/slide_editor/main',
	'bundles/transition_editor/main',
	'bundles/slide_components/main'
	// 'bundles/local_storage',
	// 'bundles/dropbox',
	// 'bundles/'
	],
function(ServiceRegistry,
		EtchExtension,
		SlideEditorBundle,
		TransitionEditorBundle,
		SlideComponents) {
	var registry = new ServiceRegistry();

	SlideEditorBundle.initialize(registry);
	TransitionEditorBundle.initialize(registry);
	SlideComponents.initialize(registry);

	return registry;
});