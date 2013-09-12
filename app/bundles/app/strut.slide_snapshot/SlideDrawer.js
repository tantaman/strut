define(
	function() {
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

			this.setSize(size);
		}

		SlideDrawer.prototype = {
			render: function() {
				/*
				ok... so we need to render each component
				Each component is slightly different..?

				We can render exactly as they are rendered for the presentation.
				We just need to do some finagle mangle?
				*/
				return this;
			},

			dispose: function() {
				this.model.off(null, null, this);
				// TODO: unbind from component events.
			},

			setSize: function(size) {
				if (size) {
					this.size = size;
					this.scale = {
						x: this.size.width / config.slide.size.width,
						y: this.size.height / config.slide.size.height
					};
				}
			}
		};

		return SlideDrawer;
	});
