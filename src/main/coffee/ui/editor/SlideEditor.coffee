###
@author Matt Crinklaw-Vogt
###
define(["vendor/amd/backbone", "./Templates",
		"./SlidePreviewPanel",
		"./OperatingTable",
		"common/EventEmitter",
		"css!./res/css/SlideEditor.css",
		"./button_bar/ButtonBarView",
		"ui/widgets/ItemGrabber",
		"vendor/amd/keymaster"],
(Backbone, Templates, SlidePreviewPanel, OperatingTable, EventEmitter, empty, ButtonBarView, ItemGrabber, Keymaster) ->

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
			Keymaster.setScope("slidePreviewPanel")
			if @hiddenActiveChange?
				@operatingTable.setModel(@hiddenActiveChange)
				@hiddenActiveChange = null

		cut: () ->
			component = @[Keymaster.getScope()]
			if component?
				component.cut()
			true

		copy: () ->
			component = @[Keymaster.getScope()]
			if component?
				component.copy()
			true

		paste: () ->
			component = @[Keymaster.getScope()]
			if component?
				component.paste()
			true

		backgroundChanged: (newBG) ->
			@operatingTable.backgroundChanged(newBG)

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

			pictureGrabber = new ItemGrabber(tag: "img", title: "Insert Image")
			siteGrabber = new ItemGrabber(tag: "iframe", title: "Insert Website")
			videoGrabber = new ItemGrabber(tag: "video", title: "Insert Video", ignoreErrors: true)
			@$el.append(pictureGrabber.render())
			@$el.append(siteGrabber.render())
			@$el.append(videoGrabber.render())
			@_buttonBar = new ButtonBarView(
				el: @$el.find(".buttonBar")
				deck: @model
				pictureGrabber: pictureGrabber
				siteGrabber: siteGrabber
				videoGrabber: videoGrabber
			)
			@_buttonBar.render()

			@$el

		resized: () ->
			if @$operatingTable
				@$slidePreviewPanel.css("height", window.innerHeight-80)
				#scalex = (window.innerWidth-168) / window.slideConfig.size.width
				#scaley = (window.innerHeight-80) / window.slideConfig.size.height
				
				@$operatingTable.css(
					height: window.innerHeight - 80
					width: window.innerWidth - 150
				)
				@operatingTable.resized()
				#window.slideConfig.size.height
				 #window.slideConfig.size.width

				#@$operatingTable.css(window.browserPrefix + "transform-origin", "0 0")
				#@$operatingTable.css(window.browserPrefix + "transform",
				#	"scale(" + scalex + ", " + scalex + ")")

				#@$operatingTable.css("height", window.innerHeight - 80)
				#@$operatingTable.css("width", window.innerWidth - 150)
	)
)