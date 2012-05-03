define(["model/geom/SpatialObject"],
(SpatialObject) ->
	SpatialObject.extend(
		initialize: () ->
			@set("components", [])

		add: (component) ->
			@attributes.components.push(component)
			@trigger("change:components.add", @, component)
	)
)