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
							hydratedComps.push(CompnentFactory.createImage(rawComp))
						when "TextBox"
							hydratedComps.push(CompnentFactory.createTextBox(rawComp))
				)

			@on("unrender", @_unrendered, @)

		_unrendered: () ->
			@get("components").forEach((component) ->
				component.trigger("unrender", true)
			)

		add: (component) ->
			@attributes.components.push(component)
			component.on("dispose", @remove, @)
			component.on("change:selected", @selectionChanged, @)
			component.on("change", @componentChanged, @)
			@trigger("change")
			@trigger("change:components.add", @, component)

		remove: (component) ->
			idx = @attributes.components.indexOf(component)
			if idx != -1
				@attributes.components.splice(idx, 1)
				@trigger("change")
				@trigger("change:components.remove", @, component)

		componentChanged: () ->
			@trigger("change")

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