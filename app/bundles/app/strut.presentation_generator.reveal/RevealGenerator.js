define(function() {
	return {
		render: function(deckAttrs) {
			return JST['strut.presentation_generator.reveal/RevealTemplate'](deckAttrs);
		},

		getStartPreviewFn: function(editorModel, sourceWind, previewStr) {
			return function () {};
		}
	};
});