define(["vendor/backbone",
		"./SlideSnapshot",
		"css!./res/css/slidePreviewPanel.css"],
(Backbone, SlideSnapshot) ->
	Backbone.View.extend(
		className: "slidePreviewPanel"
		initialize: () ->
			@model.on("add", @slideCreated, @)
			@snapshots = []

		slideCreated: (slide) ->
			snapshot = new SlideSnapshot({model: slide})
			@snapshots.push(snapshot)
			@$el.append(snapshot.render())

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