###
@author Matt Crinklaw-Vogt
###
define(["model/geom/SpatialObject",
		"./components/ComponentFactory"],
(SpatialObject, CompnentFactory) ->
	SpatialObject.extend(
		initialize: () ->
			components = @get("components")
			if not components?
				@set("components", [])
			else
				hydratedComps = []
				@set("components", hydratedComps)
				components.forEach((rawComp) =>
					switch rawComp.type
						when "ImageModel"
							comp = CompnentFactory.createImage(rawComp)
							hydratedComps.push(comp)
						when "TextBox"
							comp = CompnentFactory.createTextBox(rawComp)
							hydratedComps.push(comp)

					@_registerWithComponent(comp)
				)

			@on("unrender", @_unrendered, @)

		_unrendered: () ->
			@get("components").forEach((component) ->
				component.trigger("unrender", true)
			)

		_registerWithComponent: (component) ->
			component.on("dispose", @remove, @)
			component.on("change:selected", @selectionChanged, @)
			component.on("change", @componentChanged, @)

		getPositionData: () ->
			{
				x: @attributes.x
				y: @attributes.y
				z: @attributes.z
				impScale: @attributes.impScale
				rotateX: @attributes.rotateX
				rotateY: @attributes.rotateY
				rotateZ: @attributes.rotateZ
			}

		add: (component) ->
			@attributes.components.push(component)
			@_registerWithComponent(component)
			@trigger("contentsChanged")
			@trigger("change:components.add", @, component)

		dispose: () ->
			@set(
				active: false
				selected: false
			)
			@trigger("dispose", @)
			@off("dispose")

		remove: (component) ->
			idx = @attributes.components.indexOf(component)
			if idx != -1
				@attributes.components.splice(idx, 1)
				@trigger("contentsChanged")
				@trigger("change:components.remove", @, component)
				component.off(null, null, @)

		componentChanged: () ->
			@trigger("contentsChanged")

		unselectComponents: () ->
			if @_lastSelection
				@_lastSelection.set("selected", false)

		selectionChanged: (model, selected) ->
			if selected
				if @_lastSelection isnt model
					@attributes.components.forEach((component) ->
						if component isnt model
							component.set("selected", false)
					)
					@_lastSelection = model
				@trigger("change:activeComponent", @, model, selected)
			else
				@trigger("change:activeComponent", @, null)
				@_lastSelection = null

		constructor: `function Slide() {
			SpatialObject.prototype.constructor.apply(this, arguments);
		}`
	)
)