define(['framework/ServiceCollection'],
function(ServiceCollection) {
	// Service will be a service collection of the available backends?
	return {
		initialize: function(registry) {
			var service = new ServiceCollection(registry,
				'strut.presentation_generator',
				function(entry) { return entry.service(); });

			registry.register('strut.presentation_generator.GeneratorCollection',
				service);
		}
	};
});