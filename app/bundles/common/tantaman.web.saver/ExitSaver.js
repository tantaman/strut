define(['./Saver'],
function(Saver) {
	'use strict';
	function ExitSaver(exportables, storageInterface) {
		Saver.apply(this, arguments);
		this._unloaded = this._unloaded.bind(this);
		$(window).unload(this._unloaded);
	}

	var proto = ExitSaver.prototype = Object.create(Saver.prototype);

	proto._unloaded = function() {
		this.__save();
	};

	proto.dispose = function() {
		$(window).off('unload', this._unloaded);
	}

	return ExitSaver;
});