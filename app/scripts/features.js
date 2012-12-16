define([
	'framework/ServiceRegistry',
	'bundles/slide_editor/main',
	'bundles/transition_editor/main'
	// 'bundles/local_storage',
	// 'bundles/dropbox',
	// 'bundles/'
	],
function(ServiceRegistry,
		SlideEditorBundle,
		TransitionEditorBundle) {
	var registry = new ServiceRegistry();

	SlideEditorBundle.initialize(registry);
	TransitionEditorBundle.initialize(registry);

	return registry;
});