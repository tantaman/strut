/*
Functionality to export a zipped presentation from within the browser
hoster off the local filesystem.
*/
define(['./View'],
function(View) {
	'use strict';

	var service = {
		createView: function(editorModel) {
			return new View(editorModel.exportable);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.exporter'
			}, service);
		}
	}
});