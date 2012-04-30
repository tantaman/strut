define(["vendor/backbone",
		"./SlideSnapshot",
		"css!./res/css/slidePreviewPanel.css"],
(Backbone, SlideSnapshot) ->
	Backbone.View.extend(
		className: "slidePreviewPanel"
		initialize: () ->
			@model.on("add", @slideCreated, @)
			@model.on("remove", @slideRemoved, @)
			@snapshots = []

		slideCreated: (slide) ->
			snapshot = new SlideSnapshot({model: slide})
			@snapshots.push(snapshot)
			@$el.append(snapshot.render())

		slideRemoved: (slide, collection, options) ->
			@snapshots[options.index].remove()
			@snapshots.splice(options.index, 1)

		render: () ->
			slides = @model.get("slides")
			if slides?
				slides.each((slide) =>
					snapshot = new SlideSnapshot(slide)
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