define(function() {
	return {
		render: function(deckAttrs) {
			return JST['strut.presentation_generator.reveal/RevealTemplate'](deckAttrs);
		},

		getStartPreviewFn: function(editorModel, sourceWind, previewStr) {
      function cb() {
        var previewWind = sourceWind.previewWind;
        window.location.hash = '#/' + editorModel.activeSlideIndex();
        previewWind.document.open();
        previewWind.document.write(previewStr);
        previewWind.document.close();
        previewWind.disableHash = true;
      }
      return cb;
    }
	};
});