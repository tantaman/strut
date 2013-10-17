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
		__save: function() {
			// var data = exportable.export();
			// var identifier = exportable.identifier();
			if (!this.storageInterface.ready()) return;
			
			this.exportables.forEach(function(exportable) {
				var data = exportable.export();
				var identifier = exportable.identifier();
				this.storageInterface.store(identifier, data);
			}, this);
		},

		save: function() {
			this.__save();
		}
	};

	return Saver;
});
