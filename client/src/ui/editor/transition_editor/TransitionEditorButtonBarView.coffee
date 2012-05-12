define(["../button_bar/AbstractButtonBarView"],
(AbstractButtonBarView) ->
	buttonBarOptions =
		rotateX: (e) ->

		rotateY: (e) ->

		rotateZ: (e) ->
			

	AbstractButtonBarView.extend(
		events: () ->
			"keypress *[data-option]": "optionChosen"
			"paste *[data-option]": "optionChosen"

		initialize: () ->
			AbstractButtonBarView.prototype.initialize.call(@, buttonBarOptions)
			@model.on("change:slideRotations", @_slideRotationsChanged, @)

		_slideRotationsChanged: (model, slideRotations) ->
			@partialRender(slideRotations)

		partialRender: (slideRotations, sceneRotations) ->
			slideRotations or (slideRotations = @model.slideRotations())
			if slideRotations?
				@updateRotationControls(@$slideRotCtrls, slideRotations)

			#sceneRotations or (sceneRotations = @model.sceneRotations())

		updateRotationControls: ($which, rotations) ->
			$which.each((idx, elem) ->
				$(elem).val(rotations[idx])
			)

		render: () ->
			console.log @$el
			@$slideRotCtrls = @$el.find(".slideRotations input")
			@partialRender()
	)
)