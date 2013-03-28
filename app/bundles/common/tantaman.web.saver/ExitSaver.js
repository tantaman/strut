define(['./Saver'],
function(Saver) {
	'use strict';
	function ExitSaver(exportables, identifierGenerator) {
		Saver.apply(this, arguments);
		$(window).unload(this._unloaded.bind(this));
	}

	var proto = ExitSaver.prototype = Object.create(Saver.prototype);

	proto._unloaded = function() {
		this.exportables.forEach(function(exportable) {
			this.__save(exportable);
		}, this);
	};

	proto.dispose = function() {
		// window.off ..
	}

	return ExitSaver;
});