define(function() {
	// TODO: break impress helpers out into "common" generator directory
	// right now we're taking advantage of the fact that we just so happen
	// to know that the impress helpers are available to us.
	return {
		render: function(deck) {
			return JST["strut.presentation_generator.bespoke/BespokeTemplate"](deck);
		},

		getStartPreviewFn: function(editorModel, sourceWind, previewStr) {
			function cb() {
				var previewWind = sourceWind.previewWind;
				// TODO: reconcile this and the impress startup interface
				previewWind.document.open();
				previewWind.document.write(previewStr);
				previewWind.document.close();
			}

			return cb;
		},

		getSlideHash: function() {
			return '';
		}
	};
});