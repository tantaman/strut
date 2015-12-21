define(['./View'],
function(View) {
	'use strict';

	var service = {
		createView: function(editorModel) {
			return new View(editorModel);
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