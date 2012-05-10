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
			slideCollection.on("add", @slideCreated, @)
			slideCollection.on("remove", @slideRemoved, @)
			slideCollection.on("reset", @slidesReset, @)
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

		slidesReset: (newSlides) ->
			@snapshots.forEach((snapshot) ->
				snapshot.remove()
			)
			@snapshots = []
			newSlides.each((slide) =>
				@slideCreated(slide)
			)

		slideRemoved: (slide, collection, options) ->
			@snapshots[options.index].remove()
			@snapshots.splice(options.index, 1)

		# TODO: the slide that is clicked should set itself to selected
		# The deck should listen to its slides and set the latest
		# selection to active.
		slideClicked: (snapshot) ->
			console.log "Changing active slide"
			@model.set("activeSlide", snapshot.model)

		slideRemoveClicked: (snapshot) ->
			@model.removeSlide(snapshot.model)

		# TODO:
		# The slide snapshots should just do this for themselves
		# and it should be bound to selection state
		# not just active state.
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
					@slideCreated(slide)
					#snapshot = new SlideSnapshot({model: slide})
					#@snapshots.push(snapshot)
					#@$el.append(snapshot.render())
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