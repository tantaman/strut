define(['./View'],
function(View) {
	'use strict';

	var service = {
		createView: function(exportable) {
			return new View(exportable);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.exporter'
			}, service);
		}
	};
});