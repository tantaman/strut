###*
* @module model.presentation
* @author Matt Crinklaw-Vogt
*###
define(["common/Calcium", "./SlideCollection",
		"./Slide",
		"model/commands/SlideCommands",
		'model/common_application/UndoHistory'],
(Backbone, SlideCollection, Slide, SlideCommands, UndoHistory) ->
	###*
	This represents a slide deck.  It has a title, a currently active
	slide, a collection of slides, the filename on "disk" and
	the overarching presentation background color.
	@class model.presentation.Deck
	###
	Backbone.Model.extend(
		initialize: () ->
			# TODO: SHOULD NOT BE GLOBAL!
			window.undoHistory = new UndoHistory(20)
			@undoHistory = window.undoHistory
			@set("slides", new SlideCollection())
			slides = @get("slides")
			slides.on("add", @_slideAdded, @)
			slides.on("remove", @_slideRemoved, @)
			slides.on("reset", @_slidesReset, @)
			@_lastSelected = null
		
		###*
		Creates a new slide and adds it as the last slide in the deck.
		The newly created slide is set as the active slide in the deck.
		@method newSlide
		*###
		newSlide: () ->
			createCmd = new SlideCommands.Create(@)
			slide = createCmd.do()
			@undoHistory.push(createCmd)
			slide

		set: (key, value) ->
			# TODO: shouldn't store activeSlide in our attributes.
			if key is "activeSlide"
				@_activeSlideChanging(value)
			Backbone.Model.prototype.set.apply(this, arguments)

		###*
		Method to import an existing presentation into this deck.
		TODO: this method should be a bit less brittle.  If new properties are added
		to a deck, this won't set them.
		@method import
		@param {Object} rawObj the "json" representation of a deck
		*###
		import: (rawObj) ->
			slides = @get("slides")
			activeSlide = @get("activeSlide")
			if activeSlide?
				activeSlide.unselectComponents()
			@set("activeSlide", null)
			@set("background", rawObj.background)
			@set("fileName", rawObj.fileName)

			@undoHistory.clear()

			slides.reset(rawObj.slides)
			#@set("activeSlide", slides.at(0))

		_activeSlideChanging: (newActive) ->
			lastActive = @get("activeSlide")
			if newActive is lastActive
				return null

			if lastActive?
				lastActive.unselectComponents()
				lastActive.set({
					active: false
					selected: false
				})

			if newActive?
				newActive.set(
					selected: true
					active: true
				)
		
		_slideAdded: (slide, collection) ->
			@set("activeSlide", slide)
			@_registerWithSlide(slide)

		_slideDisposed: (slide) ->
			slide.off(null, null, @)

		_slideRemoved: (slide, collection, options) ->
			console.log "Slide removed"
			if @get("activeSlide") is slide
				if options.index < collection.length
					@set("activeSlide", collection.at(options.index))
				else if options.index > 0
					@set("activeSlide", collection.at(options.index - 1))
				else
					@set("activeSlide", null)
			slide.dispose()

		_slidesReset: (newSlides, options, oldSlides) ->
			oldSlides.forEach((slide) ->
				slide.dispose()
			)

			newSlides.forEach((slide) =>
				@_registerWithSlide(slide)
				if slide.get("active")
					slide.trigger("change:active", slide, true)
				else if slide.get("selected")
					slide.set("selected", false)
			)
			# dispose of the slides...

		_slideActivated: (slide, value) ->
			if value
				@set("activeSlide", slide)

		_slideSelected: (slide, value) ->
			if @_lastSelected? and value and @_lastSelected isnt slide
				@_lastSelected.set("selected", false)

			@_lastSelected = slide

		_registerWithSlide: (slide) ->
			slide.on("change:active", @_slideActivated, @)
			slide.on("change:selected", @_slideSelected, @)
			slide.on("dispose", @_slideDisposed, @)

		###*
		Removes the specified slide from the deck
		@method removeSlide
		@param {model.presentation.Slide} slide the slide to remove.
		*###
		removeSlide: (slide) ->
			@undoHistory.pushdo(new SlideCommands.Remove(@, slide))
			slide

		# TODO: who even uses this function?  Why does it exist?
		addSlide: (slide) ->
			# undo func?
			@get("slides").add(slide)

		undo: () ->
			@undoHistory.undo()

		redo: () ->
			@undoHistory.redo()
	)
)