define(['framework/ServiceCollection'],
function(ServiceCollection) {
	// Service will be a service collection of the available backends?
	return {
		initialize: function(registry) {
			var service = new ServiceCollection(registry,
				'strut.share',
				function(entry) { return entry.service(); });

			registry.register('strut.share.share',
				service);
		}
	};
});