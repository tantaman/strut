define(['strut/deck/Utils'],
	function(DeckUtils) {
		'use strict';

		/**
		 * Slide snapshot drawer. Paints all elements on little slide thumbnail in slide well.
		 *
		 * @param {Slide} model
		 * @param {CanvasRenderingContext2D} g2d
		 * @param {ServiceRegistry} registry
		 * @constructor
		 */
		function SlideDrawer(model, $el, size) {
			this.$el = $el;
			this.model = model;

			this.$el.css(config.slide.size);

			this._template = JST['strut.slide_snapshot/SlideDrawer'];

			this.setSize(size);

			this.render = this.render.bind(this);
			this.render = _.debounce(this.render, 250);

			this.model.on('contentsChanged', this.render, this);
		}

		SlideDrawer.prototype = {
			render: function() {
				this.$el.html(this._template(this.model.attributes));
				return this;
			},

			rescale: function() {
				this.$el.css(window.browserPrefix + 'transform',
					'scale(' + this.scale.x + ',' + this.scale.y + ')');
			},

			applyBackground: function(model, deck, opts) {
				DeckUtils.applyBackground(this.$el, model, deck, opts);
			},

			dispose: function() {
				this.model.off(null, null, this);
			},

			setSize: function(size) {
				if (size) {
					this.size = size;
					this.scale = {
						x: this.size.width / config.slide.size.width,
						y: this.size.height / config.slide.size.height
					};
					this.rescale();
				}
			}
		};

		return SlideDrawer;
	});
