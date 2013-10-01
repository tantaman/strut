define(['./RevealGenerator'],
function(RevealGenerator) {
	'use strict';

	var service = {
		displayName: 'Reveal',
		id: 'reveal',
		capabilities: {
			XYstepping: true,
			cannedTransitions: true
		},
		generate: function(deckAttrs) {
			return RevealGenerator.render(deckAttrs);
		},
		
		getSlideHash: function(editorModel) {
      		return '#/' + editorModel.activeSlideIndex();
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