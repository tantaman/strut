define(function() {
	function makeRawish(obj) {
		if (obj && obj.constructor.name != 'Object' && 'attributes' in obj)
			return obj.attributes;
		return obj;
	}

	return {
		slideSurface: function(slide, deck) {
			slide = makeRawish(slide);
			deck = makeRawish(deck);
			return this.slideSurfaceRaw(slide, deck);
		},

		slideSurfaceRaw: function(slide, deck) {
			var decksurface = deck.surface || 'bg-default';

			var result;
			if (slide) {
				result = slide.surface;
				if (result == 'bg-default' || result == null)
					result = decksurface;
			}

			if (result == null)
				result = decksurface;

			return result;
		},

		isImg: function(bg) {
			return bg && bg.indexOf('img:') == 0;
		},

		getImgUrl: function(bg) {
			return 'url(' + bg.substring(4) + ')';
		},

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
		 * also bg-default refers to the deck background if from a slide
		 * and the surface background if from a deck.
		 */
		slideBackground: function(slide, deck, opts) {
			slide = makeRawish(slide);
			deck = makeRawish(deck);

			return this.slideBackgroundRaw(slide, deck, opts);
		},

		slideBackgroundRaw: function(slide, deck, opts) {
			var deckbackground = deck.background || 'bg-transparent';
			var decksurface = deck.surface || 'bg-default';

			opts = opts || {};
			var result;
			var surface = this.slideSurface(slide, deck);
			if (slide) {
				result = slide.background;
				if (result == 'bg-default' || result == null) {
					result = deckbackground;
				}

				if (result == 'bg-transparent') {
					result = surface;
				}
			} else {
				result = deckbackground;
			}

			if (result == 'bg-default' && opts.surfaceForDefault)
				result = surface;

			if (result == surface && opts.transparentForSurface) {
				result = '';
			}

			if (result == decksurface && opts.transparentForDeckSurface)
				result = '';

			return result;
		},

		getCurrentBackgrounds: function($el) {
			return $el.attr('class').match(/bg-[^ ]+/g);
		},

		getCurrentBackground: function($el) {
			var bg = this.getCurrentBackgrounds($el);
			if (bg)
				return bg[0];
		},

		removeCurrentBackground: function($el) {
			var bgs = this.getCurrentBackgrounds($el);
			if (bgs) {
				bgs.forEach(function(bg) {
					$el.removeClass(bg);
				});
			}
				
			return bgs;
		},

		applyBackground: function($el, slide, deck, opts) {
			this.removeCurrentBackground($el);
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