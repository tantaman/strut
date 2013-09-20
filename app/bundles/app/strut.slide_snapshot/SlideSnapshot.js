define(['libs/backbone',
	'./SlideDrawer',
	'css!styles/slide_snapshot/slideSnapshot.css',
	'strut/deck/Utils',
	"strut/editor/GlobalEvents"],
	function(Backbone, SlideDrawer, css, DeckUtils, key) {
		'use strict';

		/**
		 * This class is responsible for creating little slide previews on the left of the editor.
		 *
		 * @class SlideSnapshot
		 */
		return Backbone.View.extend({
			className: 'slideSnapshot',
			events: {
				'select': '_selected',
				'click .removeBtn': '_removeClicked',
				'mousedown .removeBtn': '_removePressed',
				destroyed: 'dispose'
			},

			/**
			 * Initialize slide snapshot view.
			 */
			initialize: function() {
				this.model.on('change:selected', this._selectedChanged, this);
				this.model.on('change:active', this._activeChanged, this);
				this.model.on('dispose', this.dispose, this);
				this.model.on('change:background', this._bgChanged, this);
				this.model.on('change:surface', this._bgChanged, this);
				this.options.deck.on('change:background', this._bgChanged, this);
				this.options.deck.on('change:surface', this._bgChanged, this);

				this._template = JST['strut.slide_snapshot/SlideSnapshot'];
			},

			/**
			 * Event: element selection is being changed by user.
			 *
			 * @param {jQuery.Event} e
			 * @param {{selected: boolean, active: boolean}} options Whether or not element should be selected and active.
			 * @private
			 */
			_selected: function(e, options) {
				if (options.selected) {
					if (options.active) {
						this.model.set('active', true, options);
					}
					else {
						this.model.set('selected', true, options);
					}
				}
				else {
					this.model.set('selected', false, options);
				}
			},

			/**
			 * React on slide model's selection change.
			 *
			 * @param {Slide} model
			 * @param {boolean} value
			 * @private
			 */
			_selectedChanged: function(model, value) {
				if (value) {
					this.$el.addClass('ui-selected');
				}
				else {
					this.$el.removeClass('ui-selected');
				}
			},

			/**
			 * React on slide model's "active" attribute change.
			 *
			 * @param {Slide} model
			 * @param {boolean} value
			 * @private
			 */
			_activeChanged: function(model, value) {
				if (value) {
					this.$el.addClass('active');
				}
				else {
					this.$el.removeClass('active');
				}
			},

			/**
			 * React on slide background being changed.
			 * @private
			 */
			_bgChanged: function() {
				this._slideDrawer.applyBackground(this.model, this.options.deck, {surfaceForDefault: true});
				// this.$el.css('background-image', bg.styles[0]);
				// this.$el.css('background-image', bg.styles[1]);
			},

			/**
			 * Render slide snapshot.
			 *
			 * @returns {*}
			 */
			render: function() {
				if (this._slideDrawer) {
					this._slideDrawer.dispose();
				}

				this.$el.html(this._template(this.model.attributes));
				var $el = this.$el.find('.slideDrawer');
				this._slideDrawer = new SlideDrawer(this.model, $el, {width: 120, height: 90});
				var self = this;
				self._slideDrawer.render();

				if (this.model.get('selected')) {
					this.$el.addClass('ui-selected');
				}

				if (this.model.get('active')) {
					this.$el.addClass('active');
				}

				this._bgChanged();

				return this;
			},

			/**
			 * Event: user has pressed X button.
			 *
			 * @param {jQuery.Event} e
			 * @private
			 */
			_removeClicked: function(e) {
				this.remove(true);
				e.stopPropagation();
			},

			_removePressed: function(e) {
				e.stopPropagation();
			},

			/**
			 * Remove slide from the presentation.
			 *
			 * @param {boolean} removeModel
			 */
			remove: function(removeModel) {
				this._slideDrawer.dispose();
				this.off();
				this.$el.data('jsView', null);
				this.model.off(null, null, this);
				this.options.deck.off(null, null, this);
				Backbone.View.prototype.remove.apply(this, arguments);

				if (removeModel) {
					this.options.deck.remove(this.model);
				}
			},

			/**
			 * Dispose slide snapshot.
			 */
			dispose: function() {
				if (!this.disposed) {
					this.disposed = true;
					this.remove();
				}
			},

			constructor: function SlideSnapshot() {
				Backbone.View.prototype.constructor.apply(this, arguments);
			}
		});
	});