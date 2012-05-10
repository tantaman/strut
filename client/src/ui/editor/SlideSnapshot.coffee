###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./Templates",
		"css!./res/css/SlideSnapshot.css",
		"./raster/SlideDrawer"],
(Backbone, Templates, empty, SlideDrawer) ->
	Backbone.View.extend(
		className: "slideSnapshot"
		events:
			"click": "clicked"
			"click .removeBtn": "removeClicked"

		initialize: () ->

		clicked: () ->
			@trigger("clicked", @)

		removeClicked: (e) ->
			@trigger("removeClicked", @)
			e.stopPropagation()

		remove: () ->
			@slideDrawer.dispose()
			@off()
			Backbone.View.prototype.remove.apply(@, arguments)

		render: () ->
			if @slideDrawer?
				@slideDrawer.dispose()
			@$el.html(Templates.SlideSnapshot(@model.attributes))
			g2d = @$el.find("canvas")[0].getContext("2d")
			@slideDrawer = new SlideDrawer(@model, g2d)
			@slideDrawer.repaint()
			@$el
	)
)