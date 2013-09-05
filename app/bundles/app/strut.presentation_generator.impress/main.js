define(['./ImpressGenerator'],
function(ImpressGenerator) {
	'use strict';

	var service = {
		displayName: 'Impress',
		id: 'impress',
		generate: function(deckAttrs) {
			return ImpressGenerator.render(deckAttrs);
		},

		getStartPreviewFn: function() {
			return ImpressGenerator.getStartPreviewFn.apply(ImpressGenerator, arguments);
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