define(function() {
	function fixBackgroundAndSurface(obj) {
		var bg = obj.background;
		if (bg) {
			obj.background = undefined;
		}

		var surface = obj.surface;
		if (surface) {
			obj.surface = undefined;
		}
	}

	return {
		to1_0: function(rawDeck) {
			if (rawDeck.deckVersion == '1.0')
				return;

			rawDeck.deckVersion = '1.0';

			fixBackgroundAndSurface(rawDeck);

			rawDeck.slides.forEach(function(slide) {
				fixBackgroundAndSurface(slide);
			});
		}
	};
});