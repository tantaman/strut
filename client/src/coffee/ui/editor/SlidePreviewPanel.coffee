###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./SlideSnapshot",
		"css!./res/css/slidePreviewPanel.css"],
(Backbone, SlideSnapshot) ->
	Backbone.View.extend(
		className: "slidePreviewPanel"
		initialize: () ->
			slideCollection = @model.get("slides")
			slideCollection.on("add", @slideCreated, @)
			slideCollection.on("remove", @slideRemoved, @)
			@snapshots = []
			@model.on("change:activeSlide", @activeSlideChanged, @)

		slideCreated: (slide) ->
			snapshot = new SlideSnapshot({model: slide})
			snapshot.on("clicked", @slideClicked, @)
			snapshot.on("removeClicked", @slideRemoveClicked, @)
			@snapshots.push(snapshot)
			@$el.append(snapshot.render())

			if slide is @model.get("activeSlide")
				@activeSlideChanged(@model, slide)

		slideRemoved: (slide, collection, options) ->
			@snapshots[options.index].remove()
			@snapshots.splice(options.index, 1)

		slideClicked: (snapshot) ->
			@model.set("activeSlide", snapshot.model)

		slideRemoveClicked: (snapshot) ->
			@model.removeSlide(snapshot.model)

		activeSlideChanged: (model, slide) ->
			if not slide
				return null
			newActive = @snapshots[slide.get("num")]
			if newActive and @previousActive isnt newActive
				if @previousActive?
					@previousActive.$el.removeClass("active")
				@previousActive = newActive
				@previousActive.$el.addClass("active")

		render: () ->
			slides = @model.get("slides")
			if slides?
				slides.each((slide) =>
					snapshot = new SlideSnapshot({model: slide})
					@snapshots.push(snapshot)
					@$el.append(snapshot.render())
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