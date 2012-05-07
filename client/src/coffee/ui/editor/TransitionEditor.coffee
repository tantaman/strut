###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./TransitionSlideSnapshot",
		"css!./res/css/TransitionEditor.css"],
(Backbone, TransitionSlideSnapshot, empty) ->
	Backbone.View.extend(
		className: "transitionEditor"
		scale: 1000/250 # TODO: set up some glob config...
		# that has slide sizes and thumbnail sizes and so on
		initialize: () ->
			@name = "Transition Editor"
			@_snapshots = []
			
		show: () ->
			@$el.removeClass("disp-none")
			@render()

		hide: () ->
			@_disposeOldView()
			@$el.addClass("disp-none")

		_disposeOldView: () ->
			@_snapshots.forEach((snapshot) ->
				snapshot.remove()
			)
			@_snapshots = []

		render: () ->
			@$el.html("")
			slides = @model.get("slides")
			slides.each((slide) =>
				x = slide.get("x")
				if not x?
					# TODO: construct a better way of doing this
					slide.set("x", Math.random() * window.innerWidth)
					slide.set("y", Math.random() * window.innerHeight + 80)

				snapshot = new TransitionSlideSnapshot({model: slide})
				@_snapshots.push(snapshot)
				@$el.append(snapshot.render())
			)

			@$el
	)
)