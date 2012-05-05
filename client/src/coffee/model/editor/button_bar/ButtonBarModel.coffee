define(["vendor/backbone"],
(Backbone) ->
	fontSettings = [
		"size",
		"family",
		"color",
		"style",
		"weight",
		"decoration"
	]

	fontMethods = {}
	# Auto-generate font setters
	for setting in fontSettings
		longSetting = "font" + setting.substr(0,1).toUpperCase() + setting.substr(1)
		fontMethods[longSetting] =
			(() ->
				_longSetting = longSetting
				_setting = setting
				(value) ->
					if @_activeIsTextbox()
						console.log("Setting: " + _longSetting + " " + _setting + " " + value)
						currentValue = @get(_longSetting)
						if currentValue is value
							value = ""
						@set(_longSetting, value)
						@activeComponent.set(_setting, value))()

	Backbone.Model.extend(
		initialize: () ->
			@fetch({keyTrail: ["editor", "slideEditor", "buttonBar"]})
			_.extend(@, fontMethods)

		fontConfig: () ->
			{
				size: @get("fontSize")
				family: @get("fontFamily")
				color: @get("fontColor")
				style: @get("fontStyle")
				weight: @get("fontWeight")
				decoration: @get("fontDecoration")
				x: window.innerWidth / 2 - 150 # ugh.. magic h4x
				y: window.innerHeight / 2 - 80
				z: 0
			}

		_activeIsTextbox: () ->
			@activeComponent and @activeComponent.constructor.name is "TextBox"

		_pullFontSettings: () ->
			for setting in fontSettings
				@set("font" + setting.substr(0,1).toUpperCase() + setting.substr(1),
					@activeComponent.get(setting))

		colorSelected: (hex) ->
			@set("fontColor", hex)
			if @_activeIsTextbox()
				@activeComponent.set("color", hex)

		activeComponentChanged: (component) ->
			@activeComponent = component
			if @_activeIsTextbox()
				@_pullFontSettings()

		constructor: `function ButtonBarModel() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)