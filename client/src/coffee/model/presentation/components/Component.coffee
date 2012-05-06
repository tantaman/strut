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
	)
)