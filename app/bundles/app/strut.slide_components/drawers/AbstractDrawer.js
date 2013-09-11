define(function() {
	var AbstractDrawer;
	return AbstractDrawer = (function() {

		/**
		 * @constructor
		 * @see SlideDrawer
		 */
		function AbstractDrawer() {
		}

		/**
		 * Draw component transformations on the slide snapshot canvas.
		 *
		 * @param {Component} component
		 * @param {{x: int, y:int, width: int, height: int}} bbox Bounding box of the component.
		 * @returns {*}
		 */
		AbstractDrawer.prototype.applyTransforms = function(component, bbox) {
			var rotation, scale, skewX, skewY, transform;
			rotation = component.get("rotate");
			scale = component.get("scale");

			this.g2d.translate(bbox.x, bbox.y);
			this.g2d.translate(scale.x * bbox.width / 2, scale.y * bbox.height / 2);
			if (rotation != null) {
				this.g2d.rotate(rotation);
			}

			this.g2d.translate(-1 * scale.x * (bbox.width / 2), -1 * scale.y * (bbox.height / 2));
			if (scale != null) {
				this.g2d.scale(scale.x, scale.y);
			}

			skewX = component.get("skewX");
			skewY = component.get("skewY");
			if (skewX || skewY) {
				transform = [1, 0, 0, 1, 0, 0];
				if (skewX) {
					transform[2] = skewX;
				}
				if (skewY) {
					transform[1] = skewY;
				}
				this.g2d.transform.apply(this.g2d, transform);
			}
			return this.g2d.translate(-1 * (bbox.x), -1 * (bbox.y));
		};

		return AbstractDrawer;
	})();
});
