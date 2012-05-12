###
@author Matt Crinklaw-Vogt
###
define(["./ComponentView",
		"../Templates"],
(ComponentView) ->
	twoPI = Math.PI * 2
	ComponentView.extend(
		transforms: ["rotateX", "rotateY", "rotateZ", "scale"]
		# TODO: make this junk less verbose
		# and more common
		events: () ->
			"mousedown": "mousedown"
			"click": "clicked"
			"deltadrag span[data-delta='rotateX']": "rotateX"
			"deltadrag span[data-delta='rotateY']": "rotateY"
			"deltadrag span[data-delta='rotateZ']": "rotateZ"
			"deltadragStart span[data-delta='rotateX']": "rotateXStart"
			"deltadragStart span[data-delta='rotateY']": "rotateYStart"
			"deltadragStart span[data-delta='rotateZ']": "rotateZStart"

		initialize: () ->
			ComponentView.prototype.initialize.apply(@, arguments)

		# We could just dynamically generate all these methods instead of 
		# writing them by hand...
		rotateX: (e, deltas) ->
			rot = (deltas.dy * .02) % twoPI
			@model.set("rotateX", @_initialRotX + rot)
			@_setUpdatedTransform()

		rotateY: (e, deltas) ->
			rot = (deltas.dx * .02) % twoPI
			@model.set("rotateY", @_initialRotY + rot)
			@_setUpdatedTransform()

		rotateZ: (e, deltas) ->
			rot = @_calcRot(deltas)
			@model.set("rotateZ", @_initialRotZ + rot - @_rotZOffset)
			@_setUpdatedTransform()

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


		__getTemplate: () ->
			Templates.ThreeDRotableComponentView

		constructor: `function ThreeDRotableComponentView() {
			ComponentView.prototype.constructor.apply(this, arguments);
		}`
	)
)