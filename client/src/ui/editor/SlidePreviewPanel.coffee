###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./SlideSnapshot",
		"css!./res/css/SlidePreviewPanel.css"],
(Backbone, SlideSnapshot) ->
	Backbone.View.extend(
		className: "slidePreviewPanel"
		events:
			"sortstop": "sortstop"
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

			@$el.sortable()
			@$el

		sortstop: (e, ui) ->
			@$el.children().each((idx, elem) =>
				$(elem).data("jsView").model.set("num", idx)
			)
			@model.get("slides").sort({silent: true})

		remove: () ->
			Backbone.View.prototype.remove.apply(this, arguments)
			@dispose()

		dispose: () ->
			@snapshots.forEach((snapshot) ->
				snapshot.dispose()
			)
	)
)