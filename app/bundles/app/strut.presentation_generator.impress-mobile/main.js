define(['strut/presentation_generator/impress/ImpressGenerator'],
function(ImpressGenerator) {
	'use strict';

	var service = {
		displayName: 'Impress (mobile)',
		shortname: 'Impress(m)',
		file: 'impress',
		id: 'impressm',
		capabilities: {
			freeformStepping: true
		},
		generate: function(deck) {
			deck = {attributes: deck.attributes, mobileVersion: false};
			return ImpressGenerator.render(deck);
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