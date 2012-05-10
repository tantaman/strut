define(["vendor/backbone"],
(Backbone) ->
	buttonBarOptions =
		rotateX: (e) ->

		rotateY: (e) ->

		rotateZ: (e) ->
			

	Backbone.View.extend(
		events: () ->
			"keypress *[data-option]": "optionChosen"
			"paste *[data-option]": "optionChosen"
	)
)