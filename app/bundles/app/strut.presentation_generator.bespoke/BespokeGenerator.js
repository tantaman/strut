define(function() {
	// TODO: break impress helpers out into "common" generator directory
	// right now we're taking advantage of the fact that we just so happen
	// to know that the impress helpers are available to us.
	return {
		render: function(deckAttrs) {
			return JST["strut.presentation_generator.bespoke/BespokeTemplate"](deckAttrs);
		},

		getStartPreviewFn: function(editorModel, sourceWind, previewStr) {
			function cb() {
				var previewWind = sourceWind.previewWind;
				if (!previewWind.startPres) {
					setTimeout(cb, 200);
				} else {
					// TODO: reconcile this and the impress startup interface
					previewWind.document
						.getElementsByTagName("html")[0].innerHTML = previewStr;
					if (!previewWind.presStarted) {
						previewWind.startPres(previewWind.document, previewWind);
						previewWind.bespoke.horizontal.from('article');
					}
				}
			}

			return cb;
		}
	};
});