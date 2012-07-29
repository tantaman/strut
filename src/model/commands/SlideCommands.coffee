define(['model/presentation/Slide'],
(Slide) ->
	Create = (deck) ->
		@deck = deck
		@

	Create.prototype =
		do: () ->
			slides = @deck.get("slides")
			if not @slide?
				@slide = new Slide({num: slides.length})
			slides.add(@slide)
			@slide

		undo: () ->
			@deck.get("slides").remove(@slide)
			@slide

		name: "Create Slide"

	Remove = (deck, slide) ->
		@deck = deck
		@slide = slide
		@

	Remove.prototype =
		do: () ->
			slides = @deck.get("slides")
			@_idx = slides.indexOf(@slide)
			slides.remove(@slide)
			@slide

		undo: () ->
			@deck.get("slides").add(@slide, at: @_idx)

		name: "Remove Slide"

	Move = () ->


	result =
		Create: Create
		Remove: Remove
		Move: Move
)