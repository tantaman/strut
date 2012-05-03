define(["vendor/backbone", "./Templates",
		"./SlidePreviewPanel",
		"./OperatingTable",
		"common/EventEmitter",
		"css!./res/css/SlideEditor"],
(Backbone, Templates, SlidePreviewPanel, OperatingTable, EventEmitter, empty) ->

	menuBarOptions = 
		createSlide: () ->
			@model.newSlide()
		fontFamily: () ->
		fontSize: () ->
		fontStyle: () ->
		textBox: () ->
			activeSlide = @model.get("activeSlide")
			if activeSlide
				

		picture: () ->
		table: () ->
		shapes: () ->
		transitionEditor: () ->


	Backbone.View.extend(
		className: "slideEditor"
		events:
			"click .menuBarOption": "menuOptionChosen"

		initialize: () ->
			@name = "Slide Editor"
			$(window).resize(() =>
				@resized()
			)

			@bus = new EventEmitter()
			@operatingTable = new OperatingTable({bus: @bus})
			@slidePreviewPanel = new SlidePreviewPanel({model: @model, bus: @bus})

			@model.on("change:activeSlide", @activeSlideChanged, @)

		menuOptionChosen: (e) ->
			option = $(e.currentTarget).attr("data-option")
			menuBarOptions[option].call(@, e)

		activeSlideChanged: (model, newSlide) ->
			if @currentSlide
				@currentSlide.off("change:activeSlide", @activeSlideChanged, @)
			@currentSlide = newSlide
			if newSlide
				newSlide.on("change:activeComponent", @activeComponentChanged, @)
			@operatingTable.setModel(newSlide)

		activeComponentChanged: (model, newComponent) ->
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