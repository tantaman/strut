define(["vendor/backbone", "./Templates",
		"./SlidePreviewPanel",
		"./OperatingTable",
		"common/EventEmitter",
		"css!./res/css/SlideEditor",
		"./ButtonBarView"],
(Backbone, Templates, SlidePreviewPanel, OperatingTable, EventEmitter, empty, ButtonBarView) ->

	Backbone.View.extend(
		className: "slideEditor"

		initialize: () ->
			@name = "Slide Editor"
			$(window).resize(() =>
				@resized()
			)

			@operatingTable = new OperatingTable()
			@slidePreviewPanel = new SlidePreviewPanel({model: @model})

			@model.on("change:activeSlide", @activeSlideChanged, @)

		activeSlideChanged: (model, newSlide) ->
			@operatingTable.setModel(newSlide)

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

			if @_buttonBar?
				@_buttonBar.dispose()

			@_buttonBar = new ButtonBarView({el: @$el.find(".buttonBar"), deck: @model})

			@$el

		resized: () ->
			if @$slidePreviewPanel
				@$slidePreviewPanel.css("height", window.innerHeight - 80)
				@$operatingTable.css("height", window.innerHeight - 80)
				@$operatingTable.css("width", window.innerWidth - 150)
	)
)