define(['libs/backbone',
	'jquery.multisortable',
	'strut/slide_snapshot/SlideSnapshot',
	'common/Throttler',
	'./WellContextMenu',
	'strut/editor/GlobalEvents',
	'css!styles/slide_editor/slideWell.css',
	"tantaman/web/undo_support/CmdListFactory"],
	function(Backbone, multisortable, SlideSnapshot, Throttler, WellContextMenu, GlobalEvents, css, CmdListFactory) {
		'use strict';
		var undoHistory = CmdListFactory.managedInstance('editor');

		/**
		 * This class is responsible for rendering left sidebar with little slide previews.
		 *
		 * @class SlideWell
		 */
		return Backbone.View.extend({
			events: {
				mousemove: '_showContextMenu',
				destroyed: 'dispose',
				mousedown: '_focused'
			},

			className: 'slideWell',

			/**
			 * Initialize slide well.
			 */
			initialize: function() {
				this._deck.on('slideAdded', this._slideAdded, this);
				this._deck.on('slideMoved', this._slideMoved, this);
				this._deck.on('slidesReset', this._slidesReset, this);
				this._doShowContextMenu = this._doShowContextMenu.bind(this);
				this._throttler = new Throttler(100);
				this._contextMenu = new WellContextMenu(this._editorModel);
				this._contextMenu.render();

				this.$slides = $('<div class="' + this.className + 'List">');
				this.$slides.multisortable({
					items: "div.slideSnapshot",
					placeholder: "slidePlaceholder",
					stop: this._dragStopped.bind(this),
					mousedown: this._mousedown.bind(this),
					click: this._clicked.bind(this),
					axis: 'y'
				});

				GlobalEvents.on('cut', this._cut, this);
				GlobalEvents.on('copy', this._copy, this);
				GlobalEvents.on('paste', this._paste, this);
				GlobalEvents.on('delete', this._delete, this);

				this._clipboard = this._editorModel.clipboard;
			},

			/**
			 * Event: mouse down.
			 *
			 * @param {jQuery.Event} e
			 * @private
			 */
			_focused: function(e) {
				this._editorModel.set('scope', 'slideWell');
			},

			/**
			 * React on Cut shortcut.
			 * @private
			 */
			_cut: function() {
				if (this._editorModel.get('scope') == 'slideWell') {
					var slides = this._deck.selected;
					this._clipboard.setItems(slides);
					this._deck.remove(slides);
				}
			},

			/**
			 * React on Copy shortcut.
			 * @private
			 */
			_copy: function() {
				if (this._editorModel.get('scope') == 'slideWell') {
					var slides = this._deck.selected;
					this._clipboard.setItems(slides);
				}
			},

			/**
			 * React on Paste shortcut.
			 * @private
			 */
			_paste: function() {
				var slides = this._clipboard.getItems();
				if (slides != null && slides.length && slides[0].type != undefined && slides[0].type == 'slide') {
					this._deck.add(slides);
				}
				// TODO: scroll to the new item...
			},

			/**
			 * React on Delete shortcut.
			 * @private
			 */
			_delete: function() {
				if (this._editorModel.get('scope') == 'slideWell') {
					var slides = this._deck.selected;
					this._deck.remove(slides);
				}
			},

			/**
			 * Event: user has clicked one of the slide snapshots.
			 * 
			 * Clicking a slide forces that one to become the active
			 * slide.
			 *
			 * @param {jQuery.Event} e
			 * @private
			 */
			_clicked: function(e, $target_item) {
				var multiselect = e.ctrlKey || e.metaKey || e.shiftKey;

				$target_item.trigger('select', {
					selected: true,
					active: !multiselect,
					multiselect: multiselect
				});
			},

			/**
			 * Event: user has pressed their mouse on a slide snapshot
			 *
			 * The jquery.multisortable plugin is computing the selections
			 * for us so we need to update our model to reflect
			 * the computed selections.
			*/
			_mousedown: function(e, $target_item) {
				var multiselect = e.ctrlKey || e.metaKey || e.shiftKey;

				var activate = false;

				this.$slides.find('> .ui-selected').trigger('select', {
					selected: true,
					multiselect: multiselect
				});

				if (!this.$slides.find('.active').is('.ui-selected') && !multiselect) {
					$target_item.trigger('select', {
						selected: true,
						active: !multiselect,
						multiselect: multiselect
					});
				}
			},

			/**
			 * Event: user has finished dragging slide snapshots. We need to re-order slides accordingly.
			 *
			 * @param {jQuery.Event} event
			 * @param ui
			 * @private
			 */
			_dragStopped: function(event, ui) {
				var destination = this.$slides.children().index(this.$slides.find('.ui-selected')[0]);
				var slides = this._deck.selected;
				this._initiatedMove = true;
				this._deck.moveSlides(slides, destination);
				this._initiatedMove = false;
			},

			// TODO Add doc (describe why this one is binded to mousemove)
			_showContextMenu: function(e) {
				//if (e.target != this.$el[0]) return;
				this._throttler.submit(this._doShowContextMenu, {
					rejectionPolicy: 'runLast',
					arguments: [e]
				});
			},

			/**
			 * Shoe the context menu for the slide.
			 *
			 * @param {jQuery.Event} e
			 * @private
			 */
			_doShowContextMenu: function(e) {
				var offsetY = e.pageY - this.$slides.position().top;

				// TODO: too much magic and silliness going on here
				
				//to prevent render if new position y is overflow
				if(newPos >= this.$el.height()){
					return;
				}
				
				var newPos = (((offsetY + 40) / 114) | 0) * 114 - 5;
				this._contextMenu.reposition({x: this.$slides.width() / 2 - this._contextMenu.$el.outerWidth() / 2, y: newPos});
				this._contextMenu.slideIndex(Math.ceil(newPos / 114));
			},

			/**
			 * Refresh slide snapshots on slides reset.
			 *
			 * @param {Slide[]} newSlides
			 * @private
			 */
			_slidesReset: function(newSlides) {
				var i = 0;
				var opts = {at: 0};
				newSlides.forEach(function(slide) {
					opts.at = i;
					this._slideAdded(slide, opts);
					i += 1;
				}, this);
			},

			/**
			 * Create a slide snapshot for the new slide.
			 *
			 * @param {Slide} slide
			 * @param {number} index
			 * @private
			 */
			_slideAdded: function(slide, opts) {
				var index = opts.at;
				// Append it in the correct position in the well
				var snapshot = new SlideSnapshot({model: slide, deck: this._deck, registry: this._registry});
				if (index == 0) {
					this.$slides.prepend(snapshot.render().$el);
				} else {
					var $slides = $('.slideSnapshot');
					if (index >= $slides.length) {
						this.$slides.append(snapshot.render().$el);
					} else {
						$($slides[index]).before(snapshot.render().$el);
					}
				}
			},

			/**
			 * Move slide snapshot to a new position.
			 *
			 * @param {Slide} slide
			 * @param {number} destination
			 * @private
			 */
			_slideMoved: function(slide, destination) {
				if (this._initiatedMove) return;
				// How expensive is this for very large decks?
				this.$slides.empty();
				this._slidesReset(this._deck.get('slides').models);
			},

			/**
			 * Render slide well.
			 * @returns {*}
			 */
			render: function() {
				this.$slides.html('');
				this.$el.html(this.$slides);
				this._deck.get('slides').forEach(function(slide) {
					var snapshot = new SlideSnapshot({model: slide, deck: this._deck, registry: this._registry});
					this.$slides.append(snapshot.render().$el);
				}, this);
				this.$el.append(this._contextMenu.$el);

				var self = this;
				setTimeout(function() {
					self._doShowContextMenu({pageY: 100});
				}, 0);
				return this;
			},

			/**
			 * Dispose slide well.
			 */
			dispose: function() {
				this._deck.off(null, null, this);
				this._contextMenu.dispose();
				GlobalEvents.off(null, null, this);
			},

			constructor: function SlideWell(editorModel) {
				this._deck = editorModel.deck();
				this._registry = editorModel.registry;
				this._editorModel = editorModel;
				Backbone.View.prototype.constructor.call(this);
			}
		});
	});
