define(['./ImpressGenerator'],
function(ImpressGenerator) {
	'use strict';

	var service = {
		displayName: 'Impress',
		id: 'impress',
		capabilities: {
			transitions: [
				'freeform'
			]
		},
		generate: function(deckAttrs) {
			return ImpressGenerator.render(deckAttrs);
		},

		getSlideHash: function(editorModel) {
			return '#/step-' + (editorModel.activeSlideIndex() + 1);
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