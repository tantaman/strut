define(function() {
	var touchSupported = 'ontouchend' in document;

	function updateTouch(e) {
		var touch = e.originalEvent.changedTouches[0];
		for (var i in touch) {
			e[i] = touch[i];
		}
		e.which = 1;
	}

	function wrap(handler) {
		return function(e) {
			updateTouch(e);
			handler(e);
		}
	}

	var ons = {
		mousedown: function(element, handler) {
			var event;
			if (touchSupported) {
				event = 'touchstart';
				handler = wrap(handler);
			} else {
				event = 'mousedown';
			}

			element.on(event, handler);
			return function() {
				element.off(event, handler);
			};
		},

		mouseup: function(element, handler) {
			var event;
			if (touchSupported) {
				event = 'touchend';
				handler = wrap(handler);
			} else {
				event = 'mouseup';
			}

			element.on(event, handler);
			return function() {
				element.off(event, handler);
			};
		},

		mousemove: function(element, handler) {
			var event;
			if (touchSupported) {
				event = 'touchmove';
				handler = wrap(handler);
			} else {
				event = 'mousemove';
			}

			element.on(event, handler);
			return function() {
				element.off(event, handler);
			};
		}

		// TODO: selection + edit event...
	};

	var offs = {
		mousedown: function(element, handler) {
			if (touchSupported) {
				element.off('touchstart', handler);
			} else {
				element.off('mousedown', handler);
			}
		},

		mouseup: function(element, handler) {
			if (touchSupported) {
				element.off('touchend', handler);
			} else {
				element.off('mouseup', handler);
			}
		},

		mousemove: function(element, handler) {
			if (touchSupported) {
				element.off('touchmove', handler);
			} else {
				element.off('mousemove', handler);
			}
		}
	};

	return {
		on: ons,
		off: offs
	};
});