###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone", "./Templates",
		"./SlidePreviewPanel",
		"./OperatingTable",
		"common/EventEmitter",
		"css!./res/css/SlideEditor.css",
		"./button_bar/ButtonBarView",
		"ui/widgets/PictureGrabber"],
(Backbone, Templates, SlidePreviewPanel, OperatingTable, EventEmitter, empty, ButtonBarView, PictureGrabber) ->

	Backbone.View.extend(
		className: "slideEditor"

		initialize: () ->
			@name = "Slide Editor"
			$(window).resize(() =>
				@resized()
			)

			@operatingTable = new OperatingTable()
			@slidePreviewPanel = new SlidePreviewPanel({model: @model})

			@model.on("change:activeSlide", @_activeSlideChanged, @)

		show: () ->
			@hidden = false
			@$el.removeClass("disp-none")
			if @hiddenActiveChange?
				@operatingTable.setModel(@hiddenActiveChange)
				@hiddenActiveChange = null

		hide: () ->
			@hidden = true
			@$el.addClass("disp-none")

		_activeSlideChanged: (model, newSlide) ->
			if not @hidden
				@operatingTable.setModel(newSlide)
			else
				@hiddenActiveChange = newSlide

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

			$mainContent = @$el.find(".mainContent")
			@$slidePreviewPanel = @slidePreviewPanel.render()
			@$operatingTable = @operatingTable.render()

			$mainContent.append(@$slidePreviewPanel)
			$mainContent.append(@$operatingTable)
			@resized()

			if @_buttonBar?
				@_buttonBar.dispose()

			pictureGrabber = new PictureGrabber()
			@$el.append(pictureGrabber.render())
			@_buttonBar = new ButtonBarView({el: @$el.find(".buttonBar"), deck: @model, pictureGrabber: pictureGrabber})
			@_buttonBar.render()

			@$el

		resized: () ->
			if @$slidePreviewPanel
				@$slidePreviewPanel.css("height", window.innerHeight - 80)
				@$operatingTable.css("height", window.innerHeight - 80)
				@$operatingTable.css("width", window.innerWidth - 150)
	)
)