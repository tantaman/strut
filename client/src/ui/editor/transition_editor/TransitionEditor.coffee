###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./TransitionSlideSnapshot",
		"../Templates",
		"./TransitionEditorButtonBarView",
		"model/editor/transition_editor/TransitionEditorButtonBarModel"
		"css!../res/css/TransitionEditor.css"],
(Backbone, TransitionSlideSnapshot, Templates, ButtonBarView, ButtonBarModel, empty) ->
	Backbone.View.extend(
		className: "transitionEditor"
		events:
			"click": "clicked"
		scale: window.slideConfig.size.width/150 # TODO: set up some glob config...
		# that has slide sizes and thumbnail sizes and so on
		initialize: () ->
			@name = "Transition Editor"
			@_snapshots = []
			$(window).resize(() =>
				@resized()
			)
			
		show: () ->
			@hidden = false
			@$el.removeClass("disp-none")
			@_partialRender()

		resized: () ->
			# TODO: figure out the flow problems
			# our content is all absolute so that is one issue.
			@$el.css("height", window.innerHeight - 80)

		hide: () ->
			@hidden = true
			@_disposeOldView()
			@$el.addClass("disp-none")

		clicked: () ->
			@model.get("slides").forEach((slide) ->
				if slide.get("selected")
					slide.set("selected", false)
			)

		_disposeOldView: () ->
			@_snapshots.forEach((snapshot) ->
				snapshot.remove()
			)
			@_snapshots = []

		render: () ->
			@$el.html(Templates.TransitionEditor())

			@buttonBarView = new ButtonBarView({
				model: new ButtonBarModel({deck: @model}),
				el: @$el.find(".navbar")
			})
			
			@buttonBarView.render()
			@_partialRender()
			@resized()
			@$el

		_partialRender: () ->
			@buttonBarView.partialRender()
			$container = @$el.find(".transitionSlides")
			$container.html("")
			slides = @model.get("slides")
			colCnt = 6
			cnt = 0
			slides.each((slide) =>
				x = slide.get("x")
				if not x?
					# TODO: construct a better way of doing this
					slide.set("x", cnt * 160 + 30)
					slide.set("y", ((cnt / colCnt) | 0) * 160 + 80)
				++cnt

				snapshot = new TransitionSlideSnapshot({model: slide})
				@_snapshots.push(snapshot)
				$container.append(snapshot.render())
			)
	)
)