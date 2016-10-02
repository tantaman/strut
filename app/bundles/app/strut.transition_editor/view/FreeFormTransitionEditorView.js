define(['libs/backbone',
	'strut/slide_snapshot/TransitionSlideSnapshot',
	'strut/deck/Utils'],
	function(Backbone, TransitionSlideSnapshot, DeckUtils) {
		'use strict';

		/**
		 * Transition editor, also called an "Overview mode", allows to manage slide transitions via drag-drop.
		 *
		 * @class TransitionEditorView
		 * @augments Backbone.View
		 */
		return Backbone.View.extend({
			className: 'slideTable strut-surface',
			events: {
				"click": "_clicked"
			},
			
			/*
			 TODO: render the slides...
			 The button bar will need to be taken care of
			 through something else...
			 Register button bars with a given mode?

			 strut.TransitionButtonProviders??

			 My model is a TransitionEditorModel
			 which contains a reference to the editorModel
			 and registry.
			 */

			/**
			 * Initialize transition editor view.
			 */
			initialize: function() {
				this._snapshots = [];

				this.model.deck().on('change:surface', this._surfaceChanged, this);
				// $(document.body).css('overflow', '');
			},

			/**
			 * React on deck surface class change.
			 *
			 * @param {Deck} deck
			 * @param {string} surface
			 * @private
			 */
			_surfaceChanged: function(deck, surface) {
				if (DeckUtils.isImg(surface)) {
					this.$el.css('background-image', DeckUtils.getImgUrl(surface));
				} else {
					this.$el.css('background-image', '');
					this.$el.removeClass();
					this.$el.addClass('slideTable strut-surface ui-selectable ' + surface);
				}
			},

			/**
			 * Event: user clicked editor background.
			 *
			 * @param {jQuery.Event} e
			 * @private
			 */
			_clicked: function(e) {
				this.model.deck().unselectSlides(null, true);
			},

			/**
			 * Remove transition editor view.
			 */
			remove: function() {
				this.dispose();
			},

			/**
			 * Dispose transition editor view.
			 */
			dispose: function() {
				Backbone.View.prototype.remove.call(this);
				this.model.deck().off(null, null, this);
				this.model.deck().get('slides').forEach(function(slide) {
					slide.off(null, null, this);
				}, this);
			},

			/**
			 * Render transition editor.
			 *
			 * @returns {TransitionEditorView}
			 */
			render: function() {
				this.$el.selectable({
					filter: ".component",
					selected: function(event, ui) {
						$(ui.selected).trigger('select', ui);
					},
					unselected: function(event, ui) {
						$(ui.unselected).trigger('unselect', ui);
					}
				});

				this.$el.html('');
				var deck = this.model.deck();
				this._surfaceChanged(deck, deck.get('surface'));

				var colCnt = 6;
				var cnt = 0;
				deck.get('slides').forEach(function(slide) {
					var x = slide.get('x');

					if (x == null) {
						slide.set('x', cnt * 280 + 180);
						slide.set('y', ((cnt / colCnt) | 0) * 280 + 180);
					}
					++cnt;

					slide.on('change', function(model, options) {
						if(options.changes.some(function(change) {
							return ['x', 'y', 'z', 'rotateX', 'rotateY', 'rotateZ', 'impScale'].includes(change);
						})) {
							this.model.cannedTransition('freeform');
						}
					}, this);

					var snapshot = new TransitionSlideSnapshot({model: slide,
						registry: this.model.registry, deck: deck});
					this._snapshots.push(snapshot);
					this.$el.append(snapshot.render().$el);
				}, this);

				return this;
			},

			constructor: function TransitionEditorView() {
				Backbone.View.prototype.constructor.apply(this, arguments);
			}
		});
	});