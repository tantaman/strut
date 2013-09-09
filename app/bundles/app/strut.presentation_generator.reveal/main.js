define(['./RevealGenerator'],
function(RevealGenerator) {
	'use strict';

	var service = {
		displayName: 'Reveal',
		id: 'reveal',
		generate: function(deckAttrs) {
			return RevealGenerator.render(deckAttrs);
		},
		getStartPreviewFn: function() {
			return RevealGenerator.getStartPreviewFn.apply(RevealGenerator, arguments);
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