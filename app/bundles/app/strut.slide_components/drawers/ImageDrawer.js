define(['./AbstractDrawer'], function(AbstractDrawer) {
	'use strict';
    var ImageModelDrawer;
    return ImageModelDrawer = (function(_super) {

      __extends(ImageModelDrawer, _super);

      function ImageModelDrawer(g2d) {
        this.g2d = g2d;
      }

      ImageModelDrawer.prototype.paint = function(imageModel) {
        return this._imageLoaded(imageModel._cachedImage, imageModel);
      };

      ImageModelDrawer.prototype._imageLoaded = function(image, imageModel) {
        var bbox;
        bbox = {
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
