define(['./Saver'],
function(Saver) {
	'use strict';
	function ExitSaver(exportables, identifierGenerator) {
		Saver.apply(this, arguments);
		this._unloaded = this._unloaded.bind(this);
		$(window).unload(this._unloaded);
	}

	var proto = ExitSaver.prototype = Object.create(Saver.prototype);

	proto._unloaded = function() {
		this.exportables.forEach(function(exportable) {
			this.__save(exportable);
		}, this);
	};

	proto.dispose = function() {
		$(window).off('unload', this._unloaded);
	}

	return ExitSaver;
});