/**
 * @module model.presentation
 * @author Matt Crinklaw-Vogt
 */
define(["common/Calcium",
	"./SlideCollection",
	"./SlideCommands",
	'tantaman/web/undo_support/CmdListFactory',
	'strut/deck/Slide',
	"strut/editor/GlobalEvents"],
	function(Backbone, SlideCollection, SlideCommands, CmdListFactory, Slide, key) {

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
				this.set('background', 'defaultbg');
			},

			/**
			 * Set an attribute of the Deck.
			 *
			 * @param {String} key
			 * @param {*} value
			 * @returns {*}
			 */
			set: function(key, value) {
				if (key === "activeSlide") {
					this._activeSlideChanging(value);
				}
				return Backbone.Model.prototype.set.apply(this, arguments);
			},

			// TODO: this should be a command so we can undo it
			/**
			 * Move slide at a given index to a new index.
			 *
			 * @param sourceIndex
			 * @param destIndex
			 */
			moveSlide: function(sourceIndex, destIndex) {
				if (sourceIndex == destIndex) return;
				var slides = this.get('slides');
				var slidesCopy = slides.slice(0);
				var slide = slides.at(sourceIndex);
				slides.remove(slide, {silent: true});
				slides.add(slide, {at: destIndex, silent: true});
				slides.slidesReorganized(slidesCopy);
			},

			// TODO add doc
			slideBackground: function(bg) {
				if (bg)
					return bg || this.get('surface') || 'defaultbg'
				if (this.get('background') == 'defaultbg')
					return this.get('surface') || 'defaultbg';
				return this.get('background') || this.get('surface') || 'defaultbg';
			},

			// TODO add doc
			slideSurface: function() {
				return this.get('surface') || 'defaultbg';
			},

			// TODO remove or implement
			// resortSlides: function(sourceIndex, destIndex) {
			//   var slides = this.get('slides');

			//   for (var i = 0; i < slides.models.length; ++i) {
			//     if (sourceIndex < destIndex) {
			//       if (i <= destIndex && i > sourceIndex) {
			//         slides.models[i].set('num', i-1);
			//       }
			//       if (i == sourceIndex) {
			//         slides.models[i].set('num', destIndex);
			//       }
			//     } else if (destIndex < sourceIndex) {
			//       if (i >= destIndex && i < sourceIndex) {
			//         slides.models[i].set('num', i + 1);
			//       }
			//       if (i == sourceIndex) {
			//         slides.models[i].set('num', destIndex);
			//       }
			//     }
			//   }

			//   slides.sort();
			// },

			// TODO: this method should be a bit less brittle. If new properties are added to a deck, this won't set them.
			/**
			 * Method to import an existing presentation into this deck.
			 *
			 * @param {Object} rawObj the "json" representation of a deck
			 * @returns {*}
			 */
			"import": function(rawObj) {
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
				this.undoHistory.clear();

				// TODO: go through and dispose of all old slides...?

				return slides.reset(rawObj.slides);
			},

			/**
			 * React on change of an active slide.
			 *
			 * @param {Slide} newActive
			 * @private
			 */
			_activeSlideChanging: function(newActive) {
				var lastActive;
				lastActive = this.get("activeSlide");
				if (newActive === lastActive) {
					return;
				}
				if (lastActive !== undefined) {
					lastActive.unselectComponents();
					lastActive.set({
						active: false,
						selected: false
					});
				}
				if (newActive !== undefined) {
					return newActive.set({
						selected: true,
						active: true
					});
				}
			},

			/**
			 * React on slide being added.
			 *
			 * @param {Slide} slide
			 * @param {SlideCollection} collection
			 * @param {Object=} options
			 * @private
			 */
			_slideAdded: function(slide, collection, options) {
				this.set("activeSlide", slide);
				var idx = (options.at == null) ? collection.length : options.at;
				this.trigger("slideAdded", slide, idx);
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
			 * @param {Object=} options
			 * @private
			 */
			_slideRemoved: function(slide, collection, options) {
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
			 * @param {Object=} options
			 * @private
			 */
			_slidesReset: function(newSlides, options) {
				options.previousModels.forEach(function(slide) {
					return slide.dispose();
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
			 * @param {Boolean} value
			 * @private
			 */
			_slideActivated: function(slide, value) {
				if (value) {
					this.set("activeSlide", slide);
				}
			},

			/**
			 * Selects given slides.
			 *
			 * @param {Slide|Slide[]} slides Slides to set active.
			 * @param {Slide=} activeSlide Optional: slide, which will set as active. If not passed, first slide from "slides"
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
			 * Unselect given slides. If no slides passed, all slides will be unselected. This action does not affect active slide.
			 *
			 * @param {Slide|Slide[]} slides Slides to unselect.
			 */
			unselectSlides: function(slides) {
				slides = slides || this.get('slides').models;
				slides = _.isArray(slides) ? slides : [slides];

				slides.forEach(function(slide) {
					if (!slide.get('active')) {
					  slide.set("selected", false);
					}
				});
			},
			/**
			 * React on slide selection change.
			 *
			 * @param {Slide} slide
			 * @param {Boolean} selected
			 * @param {Boolean} options
			 * @private
			 */
			_selectionChanged: function(slide, selected, options) {
				options = options || {};
				var multiselect = options.multiselect || (key.pressed.ctrl || key.pressed.meta || key.pressed.shift);
				if (selected) {
					if (!multiselect) {
						this.get('slides').forEach(function(sl) {
							if (slide !== sl) {
								return sl.set("selected", false);
							}
						});
					}
					if (this.selected.indexOf(slide) == -1) {
						this.selected.push(slide);
					}
				} else {
					var idx = this.selected.indexOf(slide);
					if (idx !== -1) {
						this.selected.splice(idx, 1);
					}
				}

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
			 * @returns {Slide}
			 */
			create: function(index) {
				return this.undoHistory.pushdo(new SlideCommands.Add(this, null, index));
			},

			/**
			 * Adds slides to the deck. First of newly created slides is set as the active slide in the deck.
			 *
			 * @param {Slide|Slide[]} slides
			 * @param {int=} index If passed, slides will be added at this index. If not, slides will be inserted after the
			 * last selected slide.
			 * @returns {Slide}
			 */
			add: function(slides, index) {
				return this.undoHistory.pushdo(new SlideCommands.Add(this, slides, index));
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
					slide.on('unrender', slide._unrendered, slide);
					var targetIndex = options.at || (options.preserveIndexes ? slide.get("index") : lastSelectedSlideIndex + 1 + i) || 0;
					allSlides.add(slide, { at: targetIndex });
				}
				this.selectSlides(slides);
				return slides;
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
			 * @private
			 */
			_doRemove: function(slides) {
				slides = _.isArray(slides) ? slides : [slides];
				var allSlides = this.get("slides");

				// We need to remove slides in reverse order in order to keep correct indexes.
				var _slides = slides.slice(0).reverse();
				_slides.forEach(function(slide) {
					allSlides.remove(slide);
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
