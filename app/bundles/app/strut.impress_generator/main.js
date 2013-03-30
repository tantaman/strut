define(['./ImpressRenderer'],
function(ImpressRenderer) {
	'use strict';

	var service = {
		generate: function(deckAttrs) {
			return ImpressRenderer.render(deckAttrs);
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				'strut.Presentation_generator'
			}, service);
		}
	};
});