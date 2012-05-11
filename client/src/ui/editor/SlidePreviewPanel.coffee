###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./SlideSnapshot",
		"css!./res/css/SlidePreviewPanel.css"],
(Backbone, SlideSnapshot) ->
	Backbone.View.extend(
		className: "slidePreviewPanel"
		initialize: () ->
			slideCollection = @model.get("slides")
			slideCollection.on("add", @_slideCreated, @)
			slideCollection.on("reset", @_slidesReset, @)

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

		render: () ->
			slides = @model.get("slides")
			if slides?
				slides.each((slide) =>
					@_slideCreated(slide)
				)
			@$el

		remove: () ->
			Backbone.View.prototype.remove.apply(this, arguments)
			@dispose()

		dispose: () ->
			@snapshots.forEach((snapshot) ->
				snapshot.dispose()
			)
	)
)