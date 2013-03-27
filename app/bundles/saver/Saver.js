define(function() {
	'use strict';
	
	function DefaultIdentifierGenerator(exportable) {
		return ''; // TODO: uuid
	}

	function Saver(exportables, identifierGenerator) {
		this.identifierGenerator = identifierGenerator || DefaultIdentifierGenerator;
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

			if (identifier == null) {
				identifier = this.identifierGenerator(exportable);
				exportable.identifier(identifier);
			}
		}
	};

	Saver.idGenerator = DefaultIdentifierGenerator;

	return Saver;
});