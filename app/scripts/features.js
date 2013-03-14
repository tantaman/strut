define([
	'framework/ServiceRegistry',
	'bundles/etch_extension/main',
	'bundles/slide_editor/main',
	'bundles/transition_editor/main',
	'bundles/slide_components/main',
	'bundles/slide_well_context_buttons/main',
	'bundles/local_storage/main',
	'bundles/remote_storage/main',
	'bundles/storage/main',
	'bundles/default_startup/main',
	// 'bundles/dropbox/main',
	],
function(ServiceRegistry) {
	var registry = new ServiceRegistry();

	var args = Array.prototype.slice.call(arguments, 0);

	var i = 0;
	for (var i = 1; i < args.length; ++i) {
		args[i].initialize(registry);
	}

	return registry;
});