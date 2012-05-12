define(["../button_bar/AbstractButtonBarView",
		"common/Math2"],
(AbstractButtonBarView, Math2) ->
	buttonBarOptions =
		rotateX: (e) ->
			val = parseFloat(e.target.value)
			if not isNaN(val)
				@model.changeSlideRotations(val)

		rotateY: (e) ->
			val = parseFloat(e.target.value)
			if not isNaN(val)
				@model.changeSlideRotations(null, val)

		rotateZ: (e) ->
			val = parseFloat(e.target.value)
			if not isNaN(val)
				@model.changeSlideRotations(null, null, val)

		slideEditor: (e) ->
			@$el.trigger("changePerspective", {perspective: "slideEditor"})

		preview: (e) ->
			@$el.trigger("preview")

	AbstractButtonBarView.extend(
		events: () ->
			"keyup *[data-option]": "optionChosen"
			"paste *[data-option]": "optionChosen"
			"click .btn[data-option]": "optionChosen"
			"click": "clicked"

		initialize: () ->
			AbstractButtonBarView.prototype.initialize.call(@, buttonBarOptions)
			@model.on("change:slideRotations", @_slideRotationsChanged, @)

		_slideRotationsChanged: (model, slideRotations) ->
			@partialRender(slideRotations)

		clicked: (e) ->
			e.stopPropagation()
			false

		partialRender: (slideRotations, sceneRotations) ->
			slideRotations or (slideRotations = @model.slideRotations())
			if slideRotations?
				@updateRotationControls(@$slideRotCtrls, slideRotations)

			#sceneRotations or (sceneRotations = @model.sceneRotations())

		updateRotationControls: ($which, rotations) ->
			$which.each((idx, elem) ->
				val = rotations[idx]
				if not val? or isNaN(val)
					val = 0
				$(elem).val(Math2.round(val, 2))
			)

		render: () ->
			@$slideRotCtrls = @$el.find(".slideRotations input")
			@partialRender()
	)
)