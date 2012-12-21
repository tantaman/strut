define([
	'framework/ServiceRegistry',
	'bundles/slide_editor/main',
	'bundles/transition_editor/main',
	'bundles/slide_components/main'
	// 'bundles/local_storage',
	// 'bundles/dropbox',
	// 'bundles/'
	],
function(ServiceRegistry,
		SlideEditorBundle,
		TransitionEditorBundle,
		SlideComponents) {
	var registry = new ServiceRegistry();

	SlideEditorBundle.initialize(registry);
	TransitionEditorBundle.initialize(registry);
	SlideComponents.initialize(registry);

	return registry;
});