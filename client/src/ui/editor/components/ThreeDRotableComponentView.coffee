###
@author Matt Crinklaw-Vogt
###
define(["./ComponentView",
		"../Templates",
		"common/Math2"],
(ComponentView, Templates, Math2) ->
	twoPI = Math.PI * 2
	ComponentView.extend(
		transforms: ["rotateX", "rotateY", "rotateZ", "scale"]
		# TODO: make this junk less verbose
		# and more common
		# Maybe it is time to roll Yabbe into Strut
		events: () ->
			"mousedown": "mousedown"
			"click": "clicked"
			"deltadrag span[data-delta='rotateX']": "rotateX"
			"deltadrag span[data-delta='rotateY']": "rotateY"
			"deltadrag span[data-delta='rotateZ']": "rotateZ"
			"deltadragStart span[data-delta='rotateX']": "rotateXStart"
			"deltadragStart span[data-delta='rotateY']": "rotateYStart"
			"deltadragStart span[data-delta='rotateZ']": "rotateZStart"
			"change input[data-option='z']": "manualMoveZ"
			"change input[data-option='scale']": "manualMoveScale"
			"change input[data-option='rotateX']": "manualRotX"
			"change input[data-option='rotateY']": "manualRotY"
			"change input[data-option='rotateZ']": "manualRotZ"

		initialize: () ->
			ComponentView.prototype.initialize.apply(@, arguments)
			@model.on("change:rotateX", @_rotXChanged, @)
			@model.on("change:rotateY", @_rotYChanged, @)
			@model.on("change:rotateZ", @_rotZChanged, @)

		# We could just dynamically generate all these methods instead of 
		# writing them by hand...
		rotateX: (e, deltas) ->
			rot = (deltas.dy * .02) % twoPI
			@model.set("rotateX", @_initialRotX + rot)

		rotateY: (e, deltas) ->
			rot = (deltas.dx * .02) % twoPI
			@model.set("rotateY", @_initialRotY + rot)

		rotateZ: (e, deltas) ->
			rot = @_calcRot(deltas)
			@model.set("rotateZ", @_initialRotZ + rot - @_rotZOffset)

		# TODO: we could be smarter and auto-generate all these methods
		manualMoveScale: (e) ->
			@model.setFloat("impScale", e.target.value)

		manualMoveZ: (e) ->
			@model.setInt("z", e.target.value)

		manualRotX: (e) ->
			@model.setFloat("rotateX", Math2.toRads(e.target.value))

		manualRotY: (e) ->
			@model.setFloat("rotateY", Math2.toRads(e.target.value))

		manualRotZ: (e) ->
			@model.setFloat("rotateZ", Math2.toRads(e.target.value))

		rotateXStart: (e, deltas) ->
			@updateOrigin()
			@_rotXOffset = @_calcRot(deltas)
			@_initialRotX = @model.get("rotateX") || 0
		rotateYStart: (e, deltas) ->
			@updateOrigin()
			@_rotYOffset = @_calcRot(deltas)
			@_initialRotY = @model.get("rotateY") || 0
		rotateZStart: (e, deltas) ->
			@updateOrigin()
			@_rotZOffset = @_calcRot(deltas)
			@_initialRotZ = @model.get("rotateZ") || 0

		render: ->
			ComponentView.prototype.render.apply(this, arguments)
			@$rotXInput = @$el.find("[data-option='rotateX']")
			@$rotYInput = @$el.find("[data-option='rotateY']")
			@$rotZInput = @$el.find("[data-option='rotateZ']")

		_rotXChanged: (model, value) ->
			@$rotXInput.val(Math2.toDeg(value))
			@_setUpdatedTransform()

		_rotYChanged: (model, value) ->
			@$rotYInput.val(Math2.toDeg(value))
			@_setUpdatedTransform()

		_rotZChanged: (model, value) ->
			@$rotZInput.val(Math2.toDeg(value))
			@_setUpdatedTransform()


		__getTemplate: () ->
			Templates.ThreeDRotableComponentView

		constructor: `function ThreeDRotableComponentView() {
			ComponentView.prototype.constructor.apply(this, arguments);
		}`
	)
)