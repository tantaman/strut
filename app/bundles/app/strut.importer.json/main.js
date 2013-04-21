define(['common/FileUtils'],
function(FileUtils) {
	'use strict';
	
	var importer = {
		import: function(file, editorModel, next) {
			// TODO: why do the files have no mime type???
			if (file.type == 'text/json' || file.type == '' || file.type == 'application/json') {
				FileUtils.toText(file, function(json) {
					editorModel.importPresentation(JSON.parse(json));
				});
			} else {
				next();
			}
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.importer'
			}, importer);
		}
	};
});