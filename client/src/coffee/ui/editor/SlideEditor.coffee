define(["vendor/backbone", "./Templates",
		"./SlidePreviewPanel",
		"./OperatingTable",
		"common/EventEmitter",
		"css!./res/css/SlideEditor"],
(Backbone, Templates, SlidePreviewPanel, OperatingTable, EventEmitter, empty) ->
	Backbone.View.extend(
		className: "slideEditor"
		events:
			"click .newSlideBtn": "createSlide"
			"click .fontFamilySelections a": "fontFamilySelected"
			"click .fontSizeSelections a": "fontSizeSelected"
			"click .fontStyle a": "fontStyleSelected"
			"click .newSlideComponent a": "newSlideComponentSelected"
			"click .transitionEditorBtn": "transitionEditorChosen"

		initialize: () ->
			@name = "Slide Editor"
			$(window).resize(() =>
				@resized()
			)

			@bus = new EventEmitter()
			@slidePreviewPanel = new SlidePreviewPanel({model: @model.get("slides"), bus: @bus})
			@operatingTable = new OperatingTable({bus: @bus})

			@model.on("change:activeSlide", @slideChanged, @)

		createSlide: () ->
			@model.newSlide()

		colorSelected: () ->

		fontFamilySelected: () ->

		fontSizeSelected: () ->

		fontStyleSelected: () ->

		newSlideComponentSelected: () ->

		transitionEditorChosen: () ->


		slideChanged: (model, newSlide) ->
			if @currentSlide
				@currentSlide.off(null, null, @)
			@currentSlide = newSlide
			newSlide.on("change:activeComponent", @componentChanged, @)

		componentChanged: (model, newComponent) ->
			# enable / disable buttons

		render: () ->
			@$el.html(Templates.SlideEditor(@model))
			@$el.find(".dropdown-toggle").dropdown()
			$items = @$el.find("a[title]");
			$items.tooltip({
				placement: 'bottom'
				delay: {show: 1000, hide: 100}
				}).click(() ->
					$items.tooltip('hide')
				);

			$colorChooser = @$el.find(".color-chooser");
			$colorChooser.ColorPicker({
				onChange: (hsb, hex, rgb) =>
					$colorChooser.find("div").css("backgroundColor", "#" + hex)
					@colorSelected(hex)
			})

			$mainContent = @$el.find(".mainContent")
			@$slidePreviewPanel = @slidePreviewPanel.render()
			@$operatingTable = @operatingTable.render()

			$mainContent.append(@$slidePreviewPanel)
			$mainContent.append(@$operatingTable)
			@resized()

			@$el

		resized: () ->
			if @$slidePreviewPanel
				@$slidePreviewPanel.css("height", window.innerHeight - 80)
				@$operatingTable.css("height", window.innerHeight - 80)
	)
)