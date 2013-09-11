/**
 * @class SlideCommands
 */
define(['strut/deck/Slide'], function(Slide) {
	var Add, Remove;

	/**
	 * @class SlideCommands.Paste
	 * @param {Deck} deck
	 * @param {Slide|Slide[]} slides
	 * @param {int=} index
	 * @constructor
	 */
	Add = function(deck, slides, index) {
		this.deck = deck;
		this.selected = this.deck.selected.slice(0);
		this.activeSlide = this.deck.get('activeSlide');
		this.slides = slides ? slides.slice(0) : null;
		this.index = index;
	};

	Add.prototype = {
		name: 'Add Slide',

		"do": function() {
			this.slides = this.deck._doAdd(this.slides, {preserveIndexes: false, at: this.index});
		},

		undo: function() {
			this.deck._doRemove(this.slides);

			// We should restore recent selection after undo, since it may have been screwed by removal of pasted slides.
			this.deck.selectSlides(this.selected, this.activeSlide);
		}
	};

	/**
	 * @class SlideCommands.Remove
	 */
	Remove = function(deck, slides) {
		this.deck = deck;
		this.slides = slides.slice(0);
	};

	Remove.prototype = {
		name: "Remove Slide",

		"do": function() {
			this.deck._doRemove(this.slides);
		},

		undo: function() {
			this.deck._doAdd(this.slides, {preserveIndexes: true});
		}
	};

	return {
		Add: Add,
		Remove: Remove
	};
});
