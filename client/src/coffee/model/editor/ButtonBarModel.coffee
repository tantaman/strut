define(["vendor/backbone"],
(Backbone) ->
	Backbone.Model.extend(
		initialize: () ->
			@fetch({keyTrail: ["editor", "slideEditor", "buttonBar"]})

		fontConfig: () ->
			{
				size: @get("fontSize")
				family: @get("fontFamily")
				color: @get("fontColor")
				style: @get("fontStyle")
				weight: @get("fontWeight")
				x: window.innerWidth / 2 - 150 # ugh.. magic h4x
				y: window.innerHeight / 2 - 80
				z: 0
			}

		colorSelected: (hex) ->
			@set("fontColor", hex)
			if @activeComponent and @activeComponent.constructor.name is "TextBox"
				@activeComponent.set("color", hex)

		fontStyleChanged: (style) ->
			console.log "NEW FONT STYLE: " + style
			currentStyle = @get("fontStyle")
			if currentStyle is style
				style = ""
				@set("fontStyle", "")
			else
				@set("fontStyle", style)

			if @activeComponent and @activeComponent.constructor.name is "TextBox"
				@activeComponent.set("style", style)

		activeComponentChanged: (component) ->
			@activeComponent = component

		constructor: `function ButtonBarModel() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)