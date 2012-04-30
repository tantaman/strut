define(["vendor/backbone", "./SlideCollection",
		"./Slide",
		"model/common_application/UndoHistory"],
(Backbone, SlideCollection, Slide, UndoHistory) ->
	NewSlideAction = (deck) ->
		@deck = deck
		@

	NewSlideAction.prototype =
		do: () ->
			slides = @deck.get("slides")
			if not @slide?
				@slide = new Slide({num: slides.length})
			slides.add(@slide)
			@slide

		undo: () ->
			@deck.get("slides").remove(@slide)


	Backbone.Model.extend(
		initialize: () ->
			@undoHistory = new UndoHistory(20)
			@set("slides", new SlideCollection())
			

		newSlide: () ->
			action = new NewSlideAction(@)
			slide = action.do()
			@undoHistory.push(action)
			@set("activeSlide", slide)
			slide

		removeSlide: (slide) ->
			# TODO: undoableify
			@get("slides").remove(slide)

		undo: () ->
			@undoHistory.undo()

		redo: () ->
			@undoHistory.redo()
	)
)