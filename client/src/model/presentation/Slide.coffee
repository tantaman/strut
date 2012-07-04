###
@author Matt Crinklaw-Vogt
###
define(["vendor/amd/backbone",
		"model/geom/SpatialObject",
		"./components/ComponentFactory",
		"common/Math2"],
(Backbone, SpatialObject, ComponentFactory, Math2) ->
	defaults =
		z: 0
		impScale: 1
		rotateX: 0
		rotateY: 0
		rotateZ: 0

	SpatialObject.extend(
		initialize: () ->
			components = @get("components")
			if not components?
				@set("components", [])
			else
				hydratedComps = []
				@set("components", hydratedComps)
				components.forEach((rawComp) =>
					if rawComp instanceof Backbone.Model
						comp = rawComp.clone()
						hydratedComps.push(comp)
					else
						comp = ComponentFactory.create(rawComp)
						hydratedComps.push(comp)

					@_registerWithComponent(comp)
				)

			_.defaults(@attributes, defaults)

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
			# Component will need to know if it is new or the result of an undo
			# undo is currently broken as hell anyways though
			@_placeComponent(component)
			@attributes.components.push(component)
			@_registerWithComponent(component)
			@trigger("contentsChanged")
			@trigger("change:components.add", @, component)

		###*
		* A pretty naive implementation but it should do the job just fine.
		* Places a new component in a location that doesn't currently contain a component
		* @method _placeComponent
		* @param {Component} component The component to be placed
		*###
		_placeComponent: (component) ->
			@attributes.components.forEach((existingComponent) ->
				existingX = existingComponent.get("x")
				existingY = existingComponent.get("y")

				if Math2.compare(existingX, component.get("x"), 5) and \
				Math2.compare(existingY, component.get("y"), 5)

					component.set(
						x: existingX + 20
						y: existingY + 20
					)
			)

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
				component.trigger("unrender")
				component.off(null, null, @)

		componentChanged: (model, value) ->
			@trigger("contentsChanged")

		unselectComponents: () ->
			if @lastSelection
				@lastSelection.set("selected", false)

		selectionChanged: (model, selected) ->
			if selected
				if @lastSelection isnt model
					@attributes.components.forEach((component) ->
						if component isnt model
							component.set("selected", false)
					)
					@lastSelection = model
				@trigger("change:activeComponent", @, model, selected)
			else
				@trigger("change:activeComponent", @, null)
				@lastSelection = null

		constructor: `function Slide() {
			SpatialObject.prototype.constructor.apply(this, arguments);
		}`
	)
)