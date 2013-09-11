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
		function SlideDrawer(model, g2d, registry) {
			this.model = model;
			this.g2d = g2d;

			this.repaint = this.repaint.bind(this);
			this.repaint = _.debounce(this.repaint, 250);

			this.model.on('contentsChanged', this.repaint, this);
			this.size = {
				width: this.g2d.canvas.width,
				height: this.g2d.canvas.height
			};

			this.scale = {
				x: this.size.width / config.slide.size.width,
				y: this.size.height / config.slide.size.height
			};

			var drawerEntries = registry.get('strut.ComponentDrawer');
			this._drawers = {};
			drawerEntries.forEach(function(entry) {
				var drawer = entry.service();
				drawer = this._drawers[entry.meta().type] = new drawer(this.g2d);
				drawer.scale = this.scale;
			}, this);
		}

		SlideDrawer.prototype = {
			repaint: function() {
				this._paint();
			},

			_paint: function() {
				this.g2d.clearRect(0, 0, this.size.width, this.size.height);
				var components = this.model.get('components');

				components.forEach(function(component) {
					var type = component.get('type');
					var drawer = this._drawers[type];
					if (drawer) {
						this.g2d.save();
						drawer.paint(component);
						this.g2d.restore();
					}
				}, this);
			},

			dispose: function() {
				this.model.off(null, null, this);
			}
		};

		return SlideDrawer;
	});
