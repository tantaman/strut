define(['libs/backbone',
	'./SlideDrawer',
	'css!styles/slide_snapshot/slideSnapshot.css',
	'strut/deck/Utils',
	"strut/editor/GlobalEvents"],
	function(Backbone, SlideDrawer, css, DeckUtils, key) {
		'use strict';

		return Backbone.View.extend({
			className: 'slideSnapshot',
			events: {
				'click': '_clicked',
				'click .removeBtn': '_removeClicked',
				'mousedown .removeBtn': '_removePressed',
				destroyed: 'dispose'
			},

			initialize: function() {
				this.model.on('change:selected', this._selected, this);
				this.model.on('change:active', this._activated, this);
				this.model.on('dispose', this.dispose, this);
				this.model.on('change:background', this._bgChanged, this);
				this.options.deck.on('change:background', this._bgChanged, this);
				this.options.deck.on('change:surface', this._bgChanged, this);

				this._template = JST['strut.slide_snapshot/SlideSnapshot'];
			},

			_clicked: function() {
				this.select();
			},

			select: function() {
				if (key.pressed.shift) {
					if (this.model.get("selected") && !this.model.get("active")) {
						this.model.set('selected', false);
					}
					else {
						this.model.set('selected', true);
					}
				} else {
					// If slide is already selected, we need to reset selection in order to fire change callbacks. This is useful
					// when multiple slides selected and then you click one slide without shift, expecting that just the clicked
					// slide will remain selected.
					if (this.model.get('selected')) {
						this.model.set('selected', false, {silent: true});
					}
					this.model.set('selected', true);
					this.model.set('active', true);
				}
			},

			_selected: function(model, value) {
				if (value) {
					this.$el.addClass('selected');
				}
				else {
					this.$el.removeClass('selected');
				}
			},

			_activated: function(model, value) {
				if (value) {
					this.$el.addClass('active');
				}
				else {
					this.$el.removeClass('active');
				}
			},

			_bgChanged: function() {
				var bg = DeckUtils.slideBackground(this.model, this.options.deck);
				this.$el.removeClass();
				var classStr = 'slideSnapshot ' + bg;
				if (this.model.get('active'))
					classStr += ' active';
				this.$el.addClass(classStr);
				// this.$el.css('background-image', bg.styles[0]);
				// this.$el.css('background-image', bg.styles[1]);
			},

			render: function() {
				if (this._slideDrawer) {
					this._slideDrawer.dispose();
				}

				this.$el.html(this._template(this.model.attributes));
				var g2d = this.$el.find('canvas')[0].getContext('2d');
				this._slideDrawer = new SlideDrawer(this.model, g2d, this.options.registry);
				var self = this;
				setTimeout(function() {
					self._slideDrawer.repaint();
				});

				if (this.model.get('selected')) {
					this.$el.addClass('selected');
				}

				if (this.model.get('active')) {
					this.$el.addClass('active');
				}

//			this.$el.data('js')

				this._bgChanged();

				return this;
			},

			_removeClicked: function(e) {
				this.remove(true);
				e.stopPropagation();
			},

			// TODO Is this method needed at all?
			_removePressed: function(e) {
				e.stopPropagation();
			},

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