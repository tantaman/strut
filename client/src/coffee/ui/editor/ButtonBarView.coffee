define(["vendor/backbone",
		"model/editor/ButtonBarModel",
		"model/presentation/components/ComponentFactory"],
(Backbone, ButtonBarModel, ComponentFactory) ->
	# This can be a delegate / mixin that we share with the menu bar
	# for those options which appear on both bars.
	buttonBarOptions = 
		createSlide: () ->
			@deck.newSlide()
		fontFamily: () ->
		fontSize: () ->
		# Need a font weight callback
		# and text decoration callback
		fontStyle: (e) ->
			value = e.target.dataset.value
			if not value?
				$target = $(e.target)
				value = $target.parent()[0].dataset.value
			else
				$target = $(e.target)

			#if not $target.hasClass("disable")
			#	$target.toggleClass("active")

			@model.fontStyleChanged(value)

		textBox: () ->
			activeSlide = @deck.get("activeSlide")
			if activeSlide?
				activeSlide.add(
					ComponentFactory.createTextBox(@model.fontConfig()))

		picture: () ->
			# present picture insertion dialog

		table: () ->
			# present table insertion dialog
		shapes: () ->
			# shape editor?
		transitionEditor: () ->

	Backbone.View.extend(
		events:
			"click .menuBarOption": "buttonBarOptionChosen"

		initialize: () ->
			@deck = @options.deck
			@deck.on("change:activeSlide", @activeSlideChanged, @)
			@model = new ButtonBarModel()

		# should prob go in ButtonBarModel
		activeSlideChanged: (mode, newSlide) ->
			if @currentSlide
				@currentSlide.off("change:activeSlide", @activeSlideChanged, @)
			@currentSlide = newSlide
			if newSlide
				newSlide.on("change:activeComponent", @activeComponentChanged, @)

		activeComponentChanged: (slide, newComponent) ->
			# enable / disable buttons
			@model.activeComponentChanged(newComponent)
			if newComponent
				@$el.find(".fontButton").removeClass("disabled")
			else
				@$el.find(".fontButton").addClass("disabled")

		buttonBarOptionChosen: (e) ->
			option = $(e.currentTarget).attr("data-option")
			buttonBarOptions[option].call(@, e)

		dispose: () ->
			if @currentSlide
				@currentSlide.off("change:activeSlide", @activeSlideChanged, @)
			@deck.off("change:activeSlide", @activeSlideChanged, @)

		render: () ->
			$colorChooser = @$el.find(".color-chooser");
			$colorChooser.ColorPicker({
				onChange: (hsb, hex, rgb) =>
					$colorChooser.find("div").css("backgroundColor", "#" + hex)
					@model.colorSelected(hex)
			})
			@$el
	)
)