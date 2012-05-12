###
@author Tantaman
###
define(["./Component"],
(Component) ->
	Component.extend(
		initialize: () ->
			@set("type", "ImageModel")
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