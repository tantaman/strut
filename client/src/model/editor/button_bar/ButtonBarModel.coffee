###*
* @module model.editor
* @author Matt Crinklaw-Vogt / Tantaman
*###
define(["vendor/amd/backbone"],
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

	###*
	* Maintains the state of the button bar and notifies interested
	* parties of changes.  The ButtonBarModel also listens to the
	* currently selected component in the slide editor and passes
	* along the relevant changes that occur to that component.
	* @class model.editor.button_bar.ButtonBarModel
	* @constructor
	*###
	Backbone.Model.extend(
		initialize: () ->
			@fetch({keyTrail: ["editor", "slideEditor", "buttonBar"]})
			_.extend(@, fontMethods)

		###*
		* Creates an object containing the currently
		* selected font settings
		* @method fontConfig
		* @returns {Object} currently selected font settings
		*###
		fontConfig: () ->
			{
				size: @get("fontSize")
				family: @get("fontFamily")
				color: @get("fontColor")
				style: @get("fontStyle")
				weight: @get("fontWeight")
				decoration: @get("fontDecoration")
			}

		###*
		* Why does this method even exist?
		* @method imgConfig
		*###
		itemConfig: (src) ->
			{
				src: src
			}

		###*
		* Sets the text alignment
		* @method textAlign
		* @param {String} value css text-align property value
		*###
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

		###*
		* Sets the font color (and eventually shape color?)
		* @method colorSelected
		* @param {String} hex CSS hex string
		*###
		colorSelected: (hex) ->
			@set("fontColor", hex)
			if @_activeIsTextbox()
				@activeComponent.set("color", hex)

		###*
		* Sets what the ButtonBar knows as the active component
		* @method activeComponentChanged
		* @param {Object} component
		*###
		activeComponentChanged: (component) ->
			if (@activeComponent?)
				@activeComponent.off(null, null, @)

			@activeComponent = component
			if @_activeIsTextbox()
				@_pullFontSettings()
				@_bindActiveText()

		###*
		* The following are auto-generated methods for
		* setting the various font peroprties AND updating
		* the active component with that setting.
		* @method fontSize
		*###
		###*
		* @method fontFamily
		*###
		###*
		* @method fontColor
		*###
		###*
		* @method fontStyle
		*###
		###*
		* @method fontWeight
		*###
		###*
		* @method fontDecoration
		*###

		constructor: `function ButtonBarModel() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)