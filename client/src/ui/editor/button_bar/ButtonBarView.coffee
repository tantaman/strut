###
@author Tantaman
###
define(["./AbstractButtonBarView",
		"model/editor/button_bar/ButtonBarModel",
		"model/presentation/components/ComponentFactory"],
(AbstractButtonBarView, ButtonBarModel, ComponentFactory) ->
	# This can be a delegate / mixin that we share with the menu bar
	# for those options which appear on both bars.
	fontSettings = ["size", "family", "weight", "style", "decoration"]
	buttonBarOptions = 
		_extractValue: (e) ->
			value = e.target.dataset.value
			if not value?
				$target = $(e.target)
				value = $target.parent()[0].dataset.value
			value

		createSlide: () ->
			@deck.newSlide()

		textBox: () ->
			activeSlide = @deck.get("activeSlide")
			if activeSlide?
				textBox = ComponentFactory.createTextBox(@model.fontConfig())
				activeSlide.add(textBox)
				textBox.trigger("edit")

		picture: () ->
			# present picture insertion dialog
			activeSlide = @deck.get("activeSlide")
			if activeSlide?
				@options.pictureGrabber.show((src) =>
					activeSlide.add(
						ComponentFactory.createImage(@model.itemConfig(src)))
				)

		iframe: () ->
			activeSlide = @deck.get("activeSlide")
			if activeSlide?
				@options.siteGrabber.show((src) =>
					webFrame = ComponentFactory.createWebFrame(@model.itemConfig(src))
					activeSlide.add(webFrame)
				)

		video: () ->
			activeSlide = @deck.get("activeSlide")
			if activeSlide?
				@options.videoGrabber.show((src) =>
					video = ComponentFactory.createVideo(@model.itemConfig(src))
					activeSlide.add(video)
				)

		table: () ->
			# present table insertion dialog
		shapes: () ->
			# shape editor?
		chart: () ->
			# use d3 for charts
		transitionEditor: () ->
			@$el.trigger("changePerspective", {perspective: "transitionEditor"})
		preview: () ->
			@$el.trigger("preview")

		textAlign: (e) ->
			@model.textAlign(e.currentTarget.dataset.value)

	# dynamically generate the font setting handlers
	fontSettings.forEach((setting) ->
		longSetting = "font" + setting.substr(0,1).toUpperCase() + setting.substr(1)
		buttonBarOptions[longSetting] = 
			(() ->
				_longSetting = longSetting
				(e) ->
					value = buttonBarOptions._extractValue(e)
					@model[_longSetting](value)
			)()
	)

	AbstractButtonBarView.extend(
		events: () ->
			"click *[data-option]": "optionChosen"
			
		initialize: () ->
			AbstractButtonBarView.prototype.initialize.call(@, buttonBarOptions)
			@deck = @options.deck
			@deck.on("change:activeSlide", @activeSlideChanged, @)
			@model = new ButtonBarModel()
			@model.on("change:fontSize", @_fontSizeChanged, @)
			@model.on("change:fontFamily", @_fontFamilyChanged, @)

		_fontFamilyChanged: (model, value) ->
			value = value.substr(value.indexOf("'")+1, value.lastIndexOf("'")-1)
			@$el.find(".fontFamilyBtn .text").text(value)

		_fontSizeChanged: (model, value) ->
			@$el.find(".fontSizeBtn .text").text(value)

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