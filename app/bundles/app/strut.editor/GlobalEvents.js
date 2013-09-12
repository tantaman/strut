define(['libs/mousetrap', 'libs/backbone'],
function(mousetrap, Backbone) {
	'use strict';

	var result = _.extend({
		pressed: mousetrap.pressed
	}, Backbone.Events);

	mousetrap.bind(['ctrl+x', 'command+x'], function(e) {
		result.trigger('cut', e);
	});

	mousetrap.bind(['ctrl+c', 'command+c'], function(e) {
		result.trigger('copy', e);
	});

	mousetrap.bind(['ctrl+v', 'command+v'], function(e) {
		result.trigger('paste', e);
	});

	mousetrap.bind(['del', 'command+backspace'], function(e) {
		result.trigger('delete', e);
	});

	mousetrap.bind(['ctrl+z', 'command+z'], function(e) {
		result.trigger('undo', e);
	});

	mousetrap.bind(['ctrl+y', 'command+y'], function(e) {
		result.trigger('redo', e);
	});


	$(window).blur(function() {
		var keys = Object.keys(result.pressed);
		keys.forEach(function(key) {
			delete result.pressed[key];
		});
	});

	return result;
});