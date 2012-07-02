###
@author Tantaman
###
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

	toggleable = (setting) ->
		fontSettings.indexOf(setting) > 2

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
						if currentValue is value and toggleable(_setting)
							value = ""
						if _setting is "size"
							value |= 0
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
			}

		imgConfig: (src) ->
			{
				src: src
			}

		textAlign: (value) ->
			@set("textAlign", value)
			if @_activeIsTextbox()
				@activeComponent.set("align", value)

		_activeIsTextbox: () ->
			@activeComponent and @activeComponent.get("type") is "TextBox"

		_pullFontSettings: () ->
			for setting in fontSettings
				@set("font" + setting.substr(0,1).toUpperCase() + setting.substr(1),
					@activeComponent.get(setting))

		_bindActiveText: () ->
			@activeComponent.on("change:size", @_activeFontSizeChanged, @)

		_activeFontSizeChanged: (model, value) ->
			@set("fontSize", value)

		colorSelected: (hex) ->
			@set("fontColor", hex)
			if @_activeIsTextbox()
				@activeComponent.set("color", hex)

		activeComponentChanged: (component) ->
			if (@activeComponent?)
				@activeComponent.off(null, null, @)

			@activeComponent = component
			if @_activeIsTextbox()
				@_pullFontSettings()
				@_bindActiveText()

		constructor: `function ButtonBarModel() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)