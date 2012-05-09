###
@author Matt Crinklaw-Vogt
###
define(["model/geom/SpatialObject"], 
(SpatialObject) ->
	SpatialObject.extend(
		initialize: () ->
		
		dispose: () ->
			@trigger("dispose", @)
			@off()

		constructor: `function Component() {
			SpatialObject.prototype.constructor.apply(this, arguments);
		}`
	)
)