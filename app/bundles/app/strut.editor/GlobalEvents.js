define(['libs/mousetrap', 'libs/backbone'],
function(mousetrap, Backbone) {
	'use strict';

	var result = _.extend({
		pressed: mousetrap.pressed
	}, Backbone.Events)

	mousetrap.bind(['ctrl+x', 'command+x'], function(e) {
		result.trigger('cut', e);
	});

	mousetrap.bind(['ctrl+c', 'command+c'], function(e) {
		result.trigger('copy', e);
	});

	mousetrap.bind(['ctrl+v', 'command+v'], function(e) {
		result.trigger('paste', e);
	});

	return result;
});