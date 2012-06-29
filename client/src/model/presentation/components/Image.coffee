###
@author Tantaman
###
define(["./Component"],
(Component) ->
	Component.extend(
		initialize: () ->
			Component.prototype.initialize.apply(this, arguments)
			@set("type", "ImageModel")

			# We could do an HTTP request and get the content type
			# that'd be more foolproof.
			src = @get("src")
			idx = src.lastIndexOf(".")
			if idx isnt -1 and idx+1 < src.length
				extension = src.substring(idx+1, src.length)
				idx = extension.lastIndexOf("?")
				if idx isnt -1
					extension = extension.substring(0, idx)

			console.log extension

			@set("imageType",  extension.toUpperCase())
			@on("change:src", @_updateCache, @)
			@cachedImage = new Image()
			@_updateCache()

		_updateCache: () ->
			@cachedImage.src = @get("src")
			console.log @get("src")

		constructor: `function ImageModel() {
			Component.prototype.constructor.apply(this, arguments);
		}`
	)
)