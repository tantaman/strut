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

	/*
	1. Get a touchstart
	2. record the "finger" that did it
	3. wait for another touchstart
	4. check if it is the same finger
	5. check the time delta between the first and this one
	6. fire dbl click if within delta
	*/
	var dblDelta = 250;
	function createDoubleTapHandler(element, handler) {
		handler = wrap(handler);
		var initialTouch;
		var touchTime;

		return function(e) {
			var resetTouch = false;
			if (initialTouch) {
				var newTouch = e.originalEvent.changedTouches[0];
				if (newTouch.identifier == initialTouch.identifier
					 && Date.now() - touchTime < dblDelta) {
					handler(e);
					initialTouch = null;
				} else {
					resetTouch = true;
				}
			} else {
				resetTouch = true;
			}

			if (resetTouch) {
				initialTouch = e.originalEvent.changedTouches[0];
				touchTime = Date.now();
			}
		}
	}

	var ons = {
		dblclick: function(element, handler) {
			var event;
			if (touchSupported) {
				event = 'touchstart';
				handler = createDoubleTapHandler(element, handler);
			} else {
				event = 'dblclick';
			}

			element.on(event, handler);
			return function() {
				element.off(event, handler);
			}
		},

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