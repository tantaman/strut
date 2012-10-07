###
@author Matt Crinklaw-Vogt
###
define(["vendor/amd/backbone",
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
			@model.on("change:active", @_activated, @)
			@model.on("dispose", @_modelDisposed, @)
			@options.deck.on("change:background", @_updateBG, @)

		clicked: () ->
			#@trigger("clicked", @)
			@model.set("selected", true)
			@model.set("active", true)

		removeClicked: (e) ->
			@trigger("removeClicked", @)
			e.stopPropagation()

		remove: () ->
			@slideDrawer.dispose()
			@off()
			@$el.data("jsView", null)
			@model.off(null, null, @)
			@options.deck.off(null, null, @)
			Backbone.View.prototype.remove.apply(@, arguments)

		_activated: (model, value) ->
			if value
				@$el.addClass("active")
			else
				@$el.removeClass("active")

		_modelDisposed: () ->
			@model.off(null, null, @)
			@remove()

		_updateBG: () ->
			bg = @options.deck.get("background")
			console.log("BG UPDATED")
			if bg?
				@$el.css("background-image", bg.styles[0])
				@$el.css("background-image", bg.styles[1])

		render: () ->
			if @slideDrawer?
				@slideDrawer.dispose()
			@$el.html(Templates.SlideSnapshot(@model.attributes))
			g2d = @$el.find("canvas")[0].getContext("2d")
			@slideDrawer = new SlideDrawer(@model, g2d)
			setTimeout(=>
				@slideDrawer.repaint()
			, 0)

			if @model.get("active")
				@$el.addClass("active")

			@$el.data("jsView", @)

			@_updateBG()

			@$el
	)
)