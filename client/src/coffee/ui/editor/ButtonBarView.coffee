define(["vendor/backbone",
		"model/editor/ButtonBarModel",
		"model/presentation/components/ComponentFactory"],
(Backbone, ButtonBarModel, ComponentFactory) ->
	buttonBarOptions = 
		createSlide: () ->
			@deck.newSlide()
		fontFamily: () ->
		fontSize: () ->
		fontStyle: () ->
		textBox: () ->
			activeSlide = @deck.get("activeSlide")
			if activeSlide?
				activeSlide.add(ComponentFactory.createTextBox(@model))

		picture: () ->
		table: () ->
		shapes: () ->
		transitionEditor: () ->

	Backbone.View.extend(
		events:
			"click .menuBarOption": "buttonBarOptionChosen"

		initialize: () ->
			@deck = @options.deck
			@deck.on("change:activeSlide", @activeSlideChanged, @)
			@model = new ButtonBarModel()

		activeSlideChanged: (mode, newSlide) ->
			if @currentSlide
				@currentSlide.off("change:activeSlide", @activeSlideChanged, @)
			@currentSlide = newSlide
			if newSlide
				newSlide.on("change:activeComponent", @activeComponentChanged, @)

		activeComponentChanged: (model, newComponent) ->
			# enable / disable buttons

		buttonBarOptionChosen: (e) ->
			option = $(e.currentTarget).attr("data-option")
			buttonBarOptions[option].call(@, e)

		dispose: () ->
			if @currentSlide
				@currentSlide.off("change:activeSlide", @activeSlideChanged, @)
			@deck.off("change:activeSlide", @activeSlideChanged, @)

		render: () ->
			@$el
	)
)