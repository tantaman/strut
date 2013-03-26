define(['./Saver'],
function(Saver) {
	'use strict';
	function TimedSaver(exportables, idGenerator, duration) {
		Saver.apply(this, arguments);

		this._intervalH = setInterval(this.__save.bind(this), duration);
	}

	var proto = TimedSaver.prototype = Object.create(Saver.prototype);

	proto.dispose = function() {
		clearInterval(this._intervalH);
	};

	return TimedSaver;
})