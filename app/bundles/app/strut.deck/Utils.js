define(function() {
	return {
		/**
		 * TODO: simplify me!
		 *
		 * Returns the correct background class
		 * which is currently complicated by the fact that sometimes
		 * slides should be transparent and other times they should set their background
		 * to the surface color.
		 *
		 * Other problems arise from the fact that legacy presentations don't have their
		 * background attributes set.
		 *
		 * also defaultbg refers to the deck background if from a slide
		 * and the surface background if from a deck.
		 */
		slideBackground: function(slide, deck, opts) {
			opts = opts || {};
			var result;
			if (slide) {
				result = slide.get('background');
				if (result == 'defaultbg' || result == null) {
					result = deck.slideBackground();
				} else if (result == 'transparentbg') {
					result = deck.slideSurface();
				}
			} else {
				result = deck.slideBackground();
			}

			if (result == 'defaultbg' && opts.surfaceForDefault)
				result = deck.slideSurface();

			if (result == deck.slideSurface()) {
				if (opts.transparentForSurface)
					result = '';
				else if (opts.defaultForSurface)
					result = 'defaultbg';
			}

			return result;
		},

		applyBackground: function($el, slide, deck, opts) {
			var bg = this.slideBackground(slide, deck, opts);
			if (bg.indexOf('img:') == 0) {
				$el.css('background-image', 'url(' + bg.substring(4) + ')');
			} else {
				$el.css('background-image', '');
				$el.addClass(bg);
			}
		}
	};
});