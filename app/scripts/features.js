define([
	'framework/ServiceRegistry',
	'strut/etch_extension/main',
	'strut/storage/main',
	'strut/logo_button/main',
	'strut/themes/main',
	'strut/editor/main',
	'strut/exporter/json/main',
	'strut/exporter/zip/browser/main',
	'strut/importer/json/main',
	'strut/importer/main',
	'strut/exporter/main',
	'strut/presentation_generator/impress/main',
	'strut/presentation_generator/bespoke/main',
	'strut/presentation_generator/handouts/main',
	'strut/presentation_generator/impress-mobile/main',
	'strut/presentation_generator/main',
	'tantaman/web/saver/main',
	'strut/slide_editor/main',
	'strut/transition_editor/main',
	'strut/slide_components/main',
	'strut/well_context_buttons/main',
	// 'tantaman/web/local_storage/main', // LLS is being set up in main.
	// 'tantaman/web/remote_storage/main',
	'strut/startup/main',
	'dncolomer/grid/main'
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