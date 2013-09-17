/**
 * @class SlideCommands
 */
define(['strut/deck/Slide'], function(Slide) {
	var Add, Remove, Move;

	/**
	 * @class SlideCommands.Paste
	 * @param {Deck} deck
	 * @param {Slide|Slide[]} slides
	 * @param {number} [index]
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
			this.deck._doAdd(this.slides, {preserveIndexes: false, at: this.index});
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

	/**
	 * @class SlideCommands.Move
	 * @param startIndex
	 * @param slide
	 */
	Move = function(deck, slides, destination) {
		this.deck = deck;
		this.slides = slides.slice(0);
		this.destination = destination;
		this.selected = this.deck.selected.slice(0);
		this.activeSlide = this.deck.get('activeSlide');
		return this;
	};
	Move.prototype = {
		"do": function() {
			var slides = this.deck.get('slides');
			this.initial_slides_order = slides.models.slice(0);
			this.initial_selection = this.deck.selected.slice(0);
			this.initial_active_slide = this.deck.get("activeSlide");

			slides.remove(this.slides, {silent: true});
			slides.add(this.slides, {silent: true, at: this.destination});
			slides.slidesReorganized(this.initial_slides_order);

			this.deck.unselectSlides();
			this.deck.selectSlides(this.selected, this.activeSlide);

			this.deck.trigger('slideMoved');
		},
		undo: function() {
			var previous_slides_order = this.deck.get('slides').models.slice(0);
			this.deck.get('slides').models = this.initial_slides_order;
			this.deck.get('slides').slidesReorganized(previous_slides_order);

			this.deck.unselectSlides();
			this.deck.selectSlides(this.initial_selection, this.initial_active_slide);

			this.deck.trigger('slideMoved');
		},
		name: "Move Slide"
	};

	return {
		Add: Add,
		Remove: Remove,
		Move: Move
	};
});
