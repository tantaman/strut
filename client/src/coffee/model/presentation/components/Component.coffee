define(["model/geom/SpatialObject"], 
(SpatialObject) ->
	SpatialObject.extend(
		initialize: () ->
		
		dispose: () ->
			@trigger("dispose", @)
			@off()
	)
)