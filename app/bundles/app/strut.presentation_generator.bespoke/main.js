define(['./BespokeGenerator'],
function(BespokeGenerator) {
	'use strict';

	var service = {
		displayName: 'Bespoke',
		id: 'bespoke',
		capabilities: {
			cannedTransitions: true
		},
		generate: function(deckAttrs) {
			return BespokeGenerator.render(deckAttrs);
		},
		getStartPreviewFn: function() {
			return BespokeGenerator.getStartPreviewFn.apply(BespokeGenerator, arguments);
		},
		getSlideHash: function(editorModel) {
			return '#' + (editorModel.activeSlideIndex()+1);
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