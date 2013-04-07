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

		interval: (e) ->
			val = parseInt(e.target.value)
			if not isNaN(val)
				@model.setInterval(val)

		slideEditor: (e) ->
			@$el.trigger("changePerspective", {perspective: "slideEditor"})

		preview: (e) ->
			@$el.trigger("preview")

			# ahh... so now I understand css3 transforms a lot better
			# and have hit their limitations.
		lookDownZ: (e) ->
			#@$el.find(".cameraControls .active").removeClass("active")
			#@$el.find("[data-option='lookDownZ']").addClass("active")

			#$t = @$el.parents(".transitionEditor").children(".transitionSlides")
			#$t.css(window.browserPrefix + "transform", "")

		lookDownY: (e) ->
			#@$el.find(".cameraControls .active").removeClass("active")
			#@$el.find("[data-option='lookDownY']").addClass("active")

			#$t = @$el.parents(".transitionEditor").children(".transitionSlides")
			#$t.css(window.browserPrefix + "transform", "rotateX(90deg)")

		lookDownX: (e) ->
			#@$el.find(".cameraControls .active").removeClass("active")
			#@$el.find("[data-option='lookDownX']").addClass("active")

			#@$el.parents(".transitionEditor").children(".transitionSlides")
			#	.css(window.browserPrefix + "transform", "rotateY(90deg)")

	AbstractButtonBarView.extend(
		events: () ->
			"keyup *[data-option]": "optionChosen"
			"paste *[data-option]": "optionChosen"
			"click .btn[data-option]": "optionChosen"
			"click": "clicked"

		initialize: () ->
			AbstractButtonBarView.prototype.initialize.call(@, buttonBarOptions)
			#@model.on("change:slideRotations", @_slideRotationsChanged, @)

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