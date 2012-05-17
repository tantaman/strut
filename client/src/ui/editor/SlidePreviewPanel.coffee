###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./SlideSnapshot",
		"vendor/keymaster",
		"ui/interactions/CutCopyPasteTrait",
		"model/system/Clipboard"
		"css!./res/css/SlidePreviewPanel.css"],
(Backbone, SlideSnapshot, Keymaster, CutCopyPasteTrait, Clipboard, empty) ->
	Backbone.View.extend(
		className: "slidePreviewPanel"
		events:
			"sortstop": "sortstop"
			"click": "clicked"

		initialize: () ->
			slideCollection = @model.get("slides")
			slideCollection.on("add", @_slideCreated, @)
			slideCollection.on("reset", @_slidesReset, @)

			# Set up keymaster events
			CutCopyPasteTrait.applyTo(@, "slidePreviewPanel")
			@_clipboard = new Clipboard()

		_slideCreated: (slide) ->
			snapshot = new SlideSnapshot({model: slide})
			snapshot.on("removeClicked", @slideRemoveClicked, @)
			@$el.append(snapshot.render())

		_slidesReset: (newSlides) ->
			newSlides.each((slide) =>
				@_slideCreated(slide)
			)

		_slideRemoved: (slide, collection, options) ->
			@snapshots[options.index].remove()
			@snapshots.splice(options.index, 1)

		slideRemoveClicked: (snapshot) ->
			@model.removeSlide(snapshot.model)

		# TODO: make a slidepreviewpanelmodel to handle all this stuff
		cut: () ->
			slide = @model.get("activeSlide")
			if slide?
				@_clipboard.set("item", slide)
				@model.removeSlide(slide)
				slide.set("selected", false)
				false

		copy: () ->
			slide = @model.get("activeSlide")
			if slide?
				console.log slide
				@_clipboard.set("item", slide.clone())
				false

		paste: () ->
			item = @_clipboard.get("item")
			if item?
				newItem = item.clone()
				# TODO: h4x hax
				newItem.set("x", null)
				newItem.set("y", null)
				@model.addSlide(newItem)

		render: () ->
			slides = @model.get("slides")
			if slides?
				slides.each((slide) =>
					@_slideCreated(slide)
				)

			@$el.sortable()
			@$el

		sortstop: (e, ui) ->
			@$el.children().each((idx, elem) =>
				$(elem).data("jsView").model.set("num", idx)
			)
			@model.get("slides").sort({silent: true})

		clicked: () ->
			if Keymaster.getScope() isnt "slidePreviewPanel"
				Keymaster.setScope("slidePreviewPanel")

		remove: () ->
			Backbone.View.prototype.remove.apply(this, arguments)
			@dispose()

		dispose: () ->
			@snapshots.forEach((snapshot) ->
				snapshot.dispose()
			)
	)
)