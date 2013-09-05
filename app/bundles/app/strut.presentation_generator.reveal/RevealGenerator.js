define(function() {
	return {
		render: function(deckAttrs) {
			return JST['strut.presentation_generator.reveal/RevealTemplate'](deckAttrs);
		},

		getStartPreviewFn: function(editorModel, sourceWind, previewStr) {
      function cb() {
        window.location.hash = '#/' + editorModel.activeSlideIndex();
        var previewWind = sourceWind.previewWind;
        previewWind.document.open();
        previewWind.document.write(previewStr);
        previewWind.document.close();
      }
      return cb;
    }
	};
});