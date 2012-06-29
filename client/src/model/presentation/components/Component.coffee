###
@author Matt Crinklaw-Vogt
###
define(["model/geom/SpatialObject"], 
(SpatialObject) ->
	defaults =
		x: window.slideConfig.size.width / 3
		y: window.slideConfig.size.height / 3

	SpatialObject.extend(
		initialize: () ->
			_.defaults(@attributes, defaults)
			#console.log("OMG INIT!")
		
		dispose: () ->
			@trigger("dispose", @)
			@off()

		constructor: `function Component() {
			SpatialObject.prototype.constructor.apply(this, arguments);
		}`
	)
)