define(['./AbstractDrawer'],
	function(AbstractDrawer) {
		'use strict';
		var ImageModelDrawer;
		return ImageModelDrawer = (function(_super) {

			__extends(ImageModelDrawer, _super);

			/**
			 * Drawer for image components.
			 *
			 * @param {CanvasRenderingContext2D} g2d
			 * @constructor
			 * @extends AbstractDrawer
			 * @see SlideDrawer
			 */
			function ImageModelDrawer(g2d) {
				this.g2d = g2d;
			}

			/**
			 * Draws image on canvas.
			 *
			 * @param {Image} imageModel
			 * @see SlideDrawer._paint
			 */
			ImageModelDrawer.prototype.paint = function(imageModel) {
				var image = imageModel._cachedImage;
				var bbox = {
					x: imageModel.get("x") * this.scale.x,
					y: imageModel.get("y") * this.scale.y,
					width: image.naturalWidth * this.scale.x,
					height: image.naturalHeight * this.scale.y
				};
				this.applyTransforms(imageModel, bbox);
				return this.g2d.drawImage(image, bbox.x, bbox.y, bbox.width, bbox.height);
			};

			return ImageModelDrawer;

		})(AbstractDrawer);
	});
