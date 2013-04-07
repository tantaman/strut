###
@author Tantaman
###
define(["./Component", "common/FileUtils"],
(Component, FileUtils) ->
	Component.extend(
		initialize: () ->
			Component.prototype.initialize.apply(this, arguments)
			@set("type", "ImageModel")

			# We could do an HTTP request and get the content type
			# that'd be more foolproof.
			src = @get("src")
			@set("imageType",  FileUtils.imageType(src))
			@on("change:src", @_updateCache, @)
			@cachedImage = new Image()
			@_updateCache()

		_updateCache: () ->
			@cachedImage.src = @get("src")

		toBase64: () ->
			

		constructor: `function ImageModel() {
			Component.prototype.constructor.apply(this, arguments);
		}`
	)
)