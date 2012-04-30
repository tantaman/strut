define(["vendor/backbone",
		"./Templates",
		"css!./res/css/SlideSnapshot"],
(Backbone, Templates, empty) ->
	Backbone.View.extend(
		className: "slideSnapshot"
		events:
			"hoverin": "hoverin"
			"hoverout": "hoverout"
			"click": "select"
			"click .remove": "remove"

		initialize: () ->

		hoverin: () ->

		hoverout: () ->

		select: () ->

		remove: () ->

		render: () ->
			@$el.html(Templates.SlideSnapshot(@model.attributes))
			@$el
	)
)