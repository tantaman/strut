define([
	'framework/ServiceRegistry',
	'strut/etch_extension/main',
	'strut/storage/main',
	'strut/exporter/main',
	'strut/impress_generator/main',
	'strut/presentation_generator/main',
	'tantaman/web/saver/main',
	'strut/slide_editor/main',
	'strut/transition_editor/main',
	'strut/slide_components/main',
	'strut/well_context_buttons/main',
	'tantaman/web/local_storage/main',
	'tantaman/web/remote_storage/main',
	'strut/startup/main'
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