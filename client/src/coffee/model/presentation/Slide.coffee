define(["model/geom/SpatialObject"],
(SpatialObject) ->
	SpatialObject.extend(
		initialize: () ->
			@set("components", [])

		add: (component) ->
			@attributes.components.push(component)
			component.on("dispose", @remove, @)
			component.on("change:selected", @selectionChanged, @)
			@trigger("change:components.add", @, component)

		remove: (component) ->
			idx = @attributes.components.indexOf(component)
			if idx != -1
				@attributes.components.splice(idx, 1)
				@trigger("change:components.remove", @, component)

		selectionChanged: (model, selected) ->
			if selected
				@trigger("change:activeComponent", @, model, selected)
				if @_lastSelection isnt model
					@attributes.components.forEach((component) ->
						if component isnt model
							component.set("selected", false)
					)
					@_lastSelection = model
			else
				@trigger("change:activeComponent", @, null)
	)
)