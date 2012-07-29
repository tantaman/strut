###
@author Matt Crinklaw-Vogt
###
define(["common/Calcium", "./SlideCollection",
		"./Slide",
		"model/common_application/UndoHistory",
		"model/commands/SlideCommands"],
(Backbone, SlideCollection, Slide, UndoHistory, SlideCommands) ->
	Backbone.Model.extend(
		initialize: () ->
			@undoHistory = new UndoHistory(20)
			@set("slides", new SlideCollection())
			slides = @get("slides")
			slides.on("add", @_slideAdded, @)
			slides.on("remove", @_slideRemoved, @)
			slides.on("reset", @_slidesReset, @)
			@_lastSelected = null
			
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

		import: (rawObj) ->
			slides = @get("slides")
			activeSlide = @get("activeSlide")
			if activeSlide?
				activeSlide.unselectComponents()
			@set("activeSlide", null)
			@set("background", rawObj.background)
			@set("fileName", rawObj.fileName)

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

		removeSlide: (slide) ->
			@undoHistory.pushdo(new SlideCommands.Remove(@, slide))
			slide

		addSlide: (slide) ->
			# undo func?
			@get("slides").add(slide)

		undo: () ->
			@undoHistory.undo()

		redo: () ->
			@undoHistory.redo()
	)
)