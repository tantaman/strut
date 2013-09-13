define(function() {
	'use strict';

	var service = {
		displayName: 'Handouts',
		id: 'handouts',
		generate: function(deckAttrs) {
			return JST["strut.presentation_generator.handouts/HandoutsTemplate"](deckAttrs);
		},

		getSlideHash: function() {
			return '';
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.presentation_generator'
			}, service)
		}
	};
});