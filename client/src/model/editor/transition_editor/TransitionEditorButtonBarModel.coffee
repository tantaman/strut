define(["vendor/backbone"],
(Backbone) ->
	toDeg = 180 / Math.PI
	Backbone.Model.extend(
		initialize: () ->
			deck = @get("deck")
			deck.on("change:activeSlide", @_activeSlideChanged, @)
			@_lastActive = null
			@_activeSlideChanged(deck, deck.get("activeSlide"))

		_activeSlideChanged: (deck, slide) ->
			if @_lastActive?
				@_lastActive.off(null, null, @)

			@_lastActive = slide
			if slide?
				slide.on("change:rotateX", @_slideRotationChanged, @)
				slide.on("change:rotateY", @_slideRotationChanged, @)
				slide.on("change:rotateZ", @_slideRotationChanged, @)

		_slideRotationChanged: (slide, value) ->
			@trigger("change:slideRotations", @,
				@slideRotations())

		slideRotations: () ->
			slide = @_lastActive
			if slide?
				[slide.get("rotateX") * toDeg
				slide.get("rotateY") * toDeg
				slide.get("rotateZ") * toDeg]
			else
				[0,0,0]

		changeSlideRotations: () ->
			# Silently set the rotations on the active slide

		constructor: `function TransitionEditorButtonBarModel() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)