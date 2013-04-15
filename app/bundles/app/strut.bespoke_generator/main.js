define(['./BespokeGenerator'],
function(BespokeGenerator) {
	'use strict';

	var service = {
		displayName: 'Bespoke',
		id: 'bespoke',
		generate: function(deckAttrs) {
			return BespokeGenerator.render(deckAttrs);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.presentation_generator'
			}, service);
		}
	};
});