define(['./Saver'],
function(Saver) {
	'use strict';
	function ExitSaver(exportable, options) {
		this.exportable = exportable;
		this.options = options || {};
		this._unloaded = this._unloaded.bind(this);
		$(window).unload(this._unloaded);
	}

	var proto = ExitSaver.prototype;

	proto._unloaded = function() {
		var identifier;
		if (this.options.identifier) {
			identifier = this.options.identifier;
		} else {
			identifier = this.exportable.identifier();
		}

		var data = this.exportable.export();
		try {
			localStorage.setItem(identifier, JSON.stringify(data));
		} catch(e) {
			// TODO: throw up an alert about the presentation
			// not having been saved.
			localStorage.setItem(identifier, '');
		}

		if (this.options.cb)
			this.options.cb();
	};

	proto.dispose = function() {
		$(window).off('unload', this._unloaded);
	}

	return ExitSaver;
});