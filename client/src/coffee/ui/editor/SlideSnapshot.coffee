define(["vendor/backbone",
		"./Templates",
		"css!./res/css/SlideSnapshot"],
(Backbone, Templates, empty) ->
	Backbone.View.extend(
		className: "slideSnapshot"
		events:
			"hoverin": "hoverin"
			"hoverout": "hoverout"
			"click": "clicked"
			"click .removeBtn": "removeClicked"

		initialize: () ->

		hoverin: () ->

		hoverout: () ->

		clicked: () ->
			@trigger("clicked", @)

		removeClicked: () ->
			console.log("REMOVE CLICKED")
			@trigger("removeClicked", @)

		render: () ->
			@$el.html(Templates.SlideSnapshot(@model.attributes))
			@$el
	)
)