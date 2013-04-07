define(["./AbstractDrawer"],
(AbstractDrawer) ->
	class ImageModelDrawer extends AbstractDrawer
		constructor: (@g2d) ->

		paint: (imageModel) ->
			@_imageLoaded(imageModel.cachedImage, imageModel)

		_imageLoaded: (image, imageModel) ->
			bbox =
				x: imageModel.get("x") * @scale.x
				y: imageModel.get("y") * @scale.y
				width: image.naturalWidth * @scale.x
				height: image.naturalHeight * @scale.y
			
			@applyTransforms(imageModel, bbox)

			@g2d.drawImage(image, bbox.x,
								  bbox.y,
								  bbox.width,
								  bbox.height)
)