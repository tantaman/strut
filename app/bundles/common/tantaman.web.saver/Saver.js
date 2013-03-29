define(function() {
	'use strict';

	function Saver(exportables, storageInterface) {
		this.storageInterface = storageInterface;
		if (Array.isArray(exportables)) {
			this.exportables = exportables;
		} else {
			this.exportables = [exportables];
		}
	}

	Saver.prototype = {
		__save: function(exportable) {
			var data = exportable.export();
			var identifier = exportable.identifier();
		}
	};

	Saver.idGenerator = DefaultIdentifierGenerator;

	return Saver;
});