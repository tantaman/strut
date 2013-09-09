define(function() {
	return {
		slideBackground: function(slide, deck, defaultForSurface) {
			var result;
			if (slide) {
				if (slide.get('background') != 'defaultbg')
					result = slide.get('background') || deck.slideBackground();
				else
					result = deck.get('surface');
			}

			if (!result)
				result = deck.slideBackground();

			if (result == deck.get('surface') && defaultForSurface)
				return 'defaultbg'
			return result;
		}
	};
});