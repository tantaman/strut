define([
	'framework/ServiceRegistry',
	'bundles/slide_editor/main'
	// 'bundles/local_storage',
	// 'bundles/dropbox',
	// 'bundles/'
	],
function(ServiceRegistry, SlideEditorBundle) {
	var registry = new ServiceRegistry();

	SlideEditorBundle.initialize(registry);

	return registry;
});