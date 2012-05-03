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

		name: "NewSlideAction"

	RemoveSlideAction = (deck) ->
		@deck = deck
		@

	RemoveSlideAction.prototype =
		do: () ->
			console.log "DO IT!"
			slides = @deck.get("slides")
			@popped = slides.pop()
			@popped

		undo: () ->
			@deck.get("slides").add(@popped)
			@popped = null
		
		name: "RemoveSlideAction"


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
			action = new RemoveSlideAction(@)
			slide = action.do()
			@undoHistory.push(action)
			slide

		undo: () ->
			@undoHistory.undo()

		redo: () ->
			@undoHistory.redo()
	)
)