###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./TransitionSlideSnapshot",
		"./Templates",
		"css!./res/css/TransitionEditor.css"],
(Backbone, TransitionSlideSnapshot, Templates, empty) ->
	Backbone.View.extend(
		className: "transitionEditor"
		events:
			"click": "clicked"
			"click *[data-option]": "buttonChosen"
		scale: 1000/150 # TODO: set up some glob config...
		# that has slide sizes and thumbnail sizes and so on
		initialize: () ->
			@name = "Transition Editor"
			@_snapshots = []
			
		show: () ->
			@$el.removeClass("disp-none")
			@_partialRender()

		hide: () ->
			@_disposeOldView()
			@$el.addClass("disp-none")

		clicked: () ->
			@model.get("slides").forEach((slide) ->
				if slide.get("selected")
					slide.set("selected", false)
			)

		buttonChosen: (e) ->
			option = $(e.currentTarget).attr("data-option")
			switch option
				when "slideEditor" then @$el.trigger("changePerspective", {perspective: "slideEditor"})
				when "preview" then console.log "Preview..."

		_disposeOldView: () ->
			@_snapshots.forEach((snapshot) ->
				snapshot.remove()
			)
			@_snapshots = []

		render: () ->
			@$el.html(Templates.TransitionEditor())
			@_partialRender()
			@$el

		_partialRender: () ->
			$container = @$el.find(".transitionSlides")
			$container.html("")
			slides = @model.get("slides")
			slides.each((slide) =>
				x = slide.get("x")
				if not x?
					# TODO: construct a better way of doing this
					slide.set("x", Math.random() * Math.min(window.innerWidth, 1000))
					slide.set("y", Math.random() * Math.min(window.innerHeight, 700) + 80)

				snapshot = new TransitionSlideSnapshot({model: slide})
				@_snapshots.push(snapshot)
				$container.append(snapshot.render())
			)
	)
)