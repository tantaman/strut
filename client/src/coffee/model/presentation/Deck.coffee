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

		name: "Create Slide"

	RemoveSlideAction = (deck, slide) ->
		@deck = deck
		@slide = slide
		@

	RemoveSlideAction.prototype =
		do: () ->
			slides = @deck.get("slides")
			slides.remove(@slide)
			@slide

		undo: () ->
			@deck.get("slides").add(@slide)

		name: "Remove Slide"


	Backbone.Model.extend(
		initialize: () ->
			@undoHistory = new UndoHistory(20)
			@set("slides", new SlideCollection())
			slides = @get("slides")
			slides.on("add", @_slideAdded, @)
			slides.on("remove", @_slideRemoved, @)
			
		newSlide: () ->
			action = new NewSlideAction(@)
			slide = action.do()
			@undoHistory.push(action)
			slide

		_slideAdded: (slide, collection) ->
			@set("activeSlide", slide)

		_slideRemoved: (slide, collection, options) ->
			if @get("activeSlide") is slide
				if options.index < collection.length
					@set("activeSlide", collection.at(options.index))
				else if options.index > 0
					@set("activeSlide", collection.at(options.index - 1))
				else
					@set("activeSlide", null)

		removeSlide: (slide) ->
			action = new RemoveSlideAction(@, slide)
			slide = action.do()
			@undoHistory.push(action)
			slide

		undo: () ->
			@undoHistory.undo()

		redo: () ->
			@undoHistory.redo()
	)
)