/**
 * @module model.presentation
 * @author Matt Crinklaw-Vogt
 */
define(["common/Calcium",
	"./SlideCollection",
	"./SlideCommands",
	'tantaman/web/undo_support/CmdListFactory',
	'strut/deck/Slide',
	"strut/editor/GlobalEvents",
	'./DeckUpgrade',
	'./CustomBackgrounds'],
	function(Backbone, 
			 SlideCollection, 
			 SlideCommands, 
			 CmdListFactory, 
			 Slide, 
			 key, 
			 DeckUpgrade, 
			 CustomBackgrounds) {
		/**
		 * This represents a slide deck.  It has a title, a currently active slide, a collection of slides, the filename on
		 * "disk" and the overarching presentation background color.
		 *
		 * @class Deck
		 */
		return Backbone.Model.extend({

			/** @param {Slide[]} */
			selected: [],

			/**
			 * Initialize deck model.
			 */
			initialize: function() {
				var slides;
				this.undoHistory = CmdListFactory.managedInstance('editor');
				this.set("slides", new SlideCollection());
				slides = this.get("slides");
				slides.on("add", this._slideAdded, this);
				slides.on("remove", this._slideRemoved, this);
				slides.on("reset", this._slidesReset, this);
				this.set('background', 'bg-default');
			},

			/**
			 * Set an attribute of the Deck.
			 *
			 * @param {string} key
			 * @param {*} value
			 * @param {Object} [options]
			 * @returns {*}
			 */
			set: function(key, value, options) {
				if (key === "activeSlide") {
					this._activeSlideChanging(value, options);
				}
				return Backbone.Model.prototype.set.apply(this, arguments);
			},

			/**
			 * Move slide at a given index to a new index.
			 *
			 * @param {Slide|Slide[]} slides
			 * @param {number} destination
			 */
			moveSlides: function(slides, destination) {
				slides = _.isArray(slides) ? slides : [slides];
				var positionChanged = false;
				slides.forEach(function(slide, i) {
					if (slides[i].get('index') != destination + i) {
						positionChanged = true;
					}
				}, this);

				if (positionChanged) {
					this.undoHistory.pushdo(new SlideCommands.Move(this, slides, destination));
				}
			},

			// TODO add doc
			slideBackground: function() {
				return this.get('background') || 'bg-transparent';
			},

			// TODO add doc
			slideSurface: function() {
				return this.get('surface') || 'bg-default';
			},

			/**
			 * Given a color, this generates a custom background
			 * class for that color.
			 * The returned object contains the name of the 
			 * class for the color and whether or not
			 * that class existed previously.
			 * 
			 * @param {string} color hex string
			 * @returns {Object}
			 */
			addCustomBgClassFor: function(color) {
				var customBgs = this.get('customBackgrounds');
				return customBgs.add(color);
			},

			// TODO: this method should be a bit less brittle. If new properties are added to a deck, this won't set them.
			/**
			 * Method to import an existing presentation into this deck.
			 *
			 * @param {Object} rawObj the "json" representation of a deck
			 * @returns {*}
			 */
			"import": function(rawObj) {
				DeckUpgrade.to1_0(rawObj);
				var activeSlide, slides;
				slides = this.get("slides");
				activeSlide = this.get("activeSlide");
				if (activeSlide !== undefined) {
					activeSlide.unselectComponents();
				}
				this.set("activeSlide", undefined);
				this.set("background", rawObj.background);
				this.set("fileName", rawObj.fileName);
				this.set('surface', rawObj.surface);
				this.set('customStylesheet', rawObj.customStylesheet);
				this.set('deckVersion', rawObj.deckVersion);
				this.set('cannedTransition', rawObj.cannedTransition);
				var bgs = new CustomBackgrounds(rawObj.customBackgrounds);
				this.set('customBackgrounds', bgs);
				this.undoHistory.clear();

				// TODO: go through and dispose of all old slides...?

				slides.reset(rawObj.slides);

				bgs.deck = this;
				bgs.prune();
			},

			/**
			 * React on change of an active slide.
			 *
			 * @param {Slide} newActive
			 * @param {Object} [options]
			 * @private
			 */
			_activeSlideChanging: function(newActive, options) {
				var lastActive = this.get("activeSlide");
				if (newActive === lastActive) {
					return;
				}
				if (lastActive) {
					lastActive.unselectComponents();
					lastActive.set({
						active: false,
						selected: false
					}, options);
				}
				if (newActive) {
					newActive.set({
						selected: true,
						active: true
					}, options);
				}
			},

			/**
			 * React on slide being added.
			 *
			 * @param {Slide} slide
			 * @param {SlideCollection} collection
			 * @param {{at: number}} [options]
			 * @private
			 */
			_slideAdded: function(slide, collection, options) {
				options = options || {};
				options.at = _.isNumber(options.at) ? options.at : collection.length;
				this.set("activeSlide", slide, options);
				this.trigger("slideAdded", slide, options);
				this._registerWithSlide(slide);
			},

			/**
			 * React on slide being disposed.
			 *
			 * @param {Slide} slide
			 * @private
			 */
			_slideDisposed: function(slide) {
				slide.off(null, null, this);
			},

			/**
			 * React on slide being removed.
			 *
			 * @param {Slide} slide
			 * @param {SlideCollection} collection
			 * @param {{index: number}} [options]
			 * @private
			 */
			_slideRemoved: function(slide, collection, options) {
				options = options || {};
				if (this.get("activeSlide") === slide) {
					if (options.index < collection.length) {
						this.set("activeSlide", collection.at(options.index));
					} else if (options.index > 0) {
						this.set("activeSlide", collection.at(options.index - 1));
					} else {
						this.set("activeSlide", undefined);
					}
				}
				slide.dispose();
			},

			/**
			 * React on slide collection reset.
			 *
			 * @param {Slide[]} newSlides
			 * @param {{previousModels: Slide[]}} [options]
			 * @private
			 */
			_slidesReset: function(newSlides, options) {
				options = options || {};
				options.previousModels.forEach(function(slide) {
					slide.dispose();
				});
				this.trigger('slidesReset', newSlides);
				return newSlides.forEach(function(slide) {
					this._registerWithSlide(slide);
					if (slide.get("active")) {
						slide.trigger("change:active", slide, true);
						slide.trigger("change:selected", slide, true);
						this._selectionChanged(slide, true);
					} else if (slide.get("selected")) {
						slide.set("selected", false);
					}
				}, this);
			},

			/**
			 * React on slide being set to active.
			 *
			 * @param {Slide} slide
			 * @param {boolean} value
			 * @param {Object} [options]
			 * @private
			 */
			_slideActivated: function(slide, value, options) {
				if (value) {
					this.set("activeSlide", slide, options);
				}
			},

			/**
			 * Selects given slides.
			 *
			 * @param {Slide|Slide[]} slides Slides to set active.
			 * @param {Slide} [activeSlide] Optional: slide, which will set as active. If not passed, first slide from "slides"
			 * will be set active.
			 */
			selectSlides: function(slides, activeSlide) {
				slides = _.isArray(slides) ? slides : [slides];
				if (slides.length) {
					activeSlide = activeSlide || slides[0];
					this.get('slides').forEach(function(sl) {
						return sl.set("selected", false);
					});

					activeSlide.set("active", true, { multiselect: true });
					slides.forEach(function(slide) {
						slide.set("selected", true, { multiselect: true });
					});
				}
			},

			/**
			 * Unselect given slides. If no slides passed, all slides will be unselected.
			 *
			 * @param {Slide|Slide[]} [slides] Slides to unselect.
			 * @param {boolean} [includeActive=false] If true, even active slide will be unselected (but not deactivated).
			 */
			unselectSlides: function(slides, includeActive) {
				slides = slides || this.get('slides').models;
				slides = _.isArray(slides) ? slides : [slides];

				slides.forEach(function(slide) {
					if (includeActive || !slide.get('active')) {
						slide.set("selected", false);
					}
				});
			},

			/**
			 * React on slide selection change.
			 *
			 * @param {Slide} slide
			 * @param {boolean} selected
			 * @param {{multiselect: Boolean}} [options]
			 * @private
			 */
			_selectionChanged: function(slide, selected, options) {
				options = options || {};
				var multiselect = options.multiselect || (key.pressed.ctrl || key.pressed.meta || key.pressed.shift);
				if (selected) {
					if (!multiselect) {
						this.get('slides').forEach(function(sl) {
							if (slide !== sl) {
								sl.set("selected", false);
							}
						});
					}
					if (this.selected.indexOf(slide) == -1) {
						this.selected.push(slide);
						this._sortSelectedSlides();
					}
				} else {
					var idx = this.selected.indexOf(slide);
					if (idx !== -1) {
						this.selected.splice(idx, 1);
						this._sortSelectedSlides();
					}
				}
			},

			_sortSelectedSlides: function() {
				// Assign index for each slide and sort slides by this index, so that if you undo, slides would be inserted in
				// correct order.
				this.selected.sort(function(a, b) {
					return a.get('index') - b.get('index');
				});
			},

			/**
			 * Register callbacks on slide events.
			 *
			 * @param {Slide} slide
			 * @private
			 */
			_registerWithSlide: function(slide) {
				slide.on("change:active", this._slideActivated, this);
				slide.on("change:selected", this._selectionChanged, this);
				slide.on("dispose", this._slideDisposed, this);
			},

			/**
			 * Creates a new slide. The newly created slide is set as the active
			 * slide in the deck.
			 *
			 * @param index If passed, slide will be added at given index. If not, it will be added as the last slide in the deck.
			 */
			create: function(index) {
				this.undoHistory.pushdo(new SlideCommands.Add(this, null, index));
			},

			/**
			 * Adds slides to the deck. First of newly created slides is set as the active slide in the deck.
			 *
			 * @param {Slide|Slide[]} slides
			 * @param {number} [index] If passed, slides will be added at this index. If not, slides will be inserted after the
			 * last selected slide.
			 */
			add: function(slides, index) {
				this.undoHistory.pushdo(new SlideCommands.Add(this, slides, index));
			},

			/**
			 * Callback for slide addition command.
			 * @see SlideCommands.Add
			 *
			 * @param {Slide|Slide[]} slides
			 * @param {Object} options
			 * @private
			 */
			_doAdd: function(slides, options) {
				var allSlides = this.get("slides");

				slides = slides || [new Slide()];
				slides = _.isArray(slides) ? slides : [slides];
				options = options || {};

				if (!options.preserveIndexes && this.selected.length) {
					var lastSelectedSlideIndex = allSlides.indexOf(this.selected[this.selected.length - 1]);
				}

				for (var i = 0; i < slides.length; i++) {
					var slide = slides[i];
					slide.on('unrender', slide.unrendered, slide);
					options.at = _.isNumber(options.at) ? (options.at + i) : (options.preserveIndexes ? slide.get("index") : lastSelectedSlideIndex + 1 + i) || 0;
					allSlides.add(slide, options);
				}
				this.selectSlides(slides);
			},

			/**
			 * Removes set of slides from the deck. Can be undone.
			 *
			 * @param {Slide|Slide[]} slides
			 */
			remove: function(slides) {
				slides = _.isArray(slides) ? slides : [slides];
				this.undoHistory.pushdo(new SlideCommands.Remove(this, slides));
			},

			/**
			 * Callback for slide removal command.
			 * @see SlideCommands.Remove
			 *
			 * @param {Slide|Slide[]} slides
			 * @param {Object} options
			 * @private
			 */
			_doRemove: function(slides, options) {
				slides = _.isArray(slides) ? slides : [slides];
				var allSlides = this.get("slides");

				// We need to remove slides in reverse order in order to keep correct indexes.
				var _slides = slides.slice(0).reverse();
				_slides.forEach(function(slide) {
					allSlides.remove(slide, options);
					slide.off();
					slide.dispose();
				});
			},

			/**
			 * Undo last command.
			 */
			undo: function() {
				this.undoHistory.undo();
			},

			/**
			 * Redo next command.
			 */
			redo: function() {
				this.undoHistory.redo();
			}
		});
	})
;
