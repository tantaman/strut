###
@author Tantaman
###
define(["./Component"],
(Component) ->
	Component.extend(
		initialize: () ->
			@set("type", "TextBox")
			if not @get("text")?
				@set("text", "Text")

		textWithBreaks: () ->
			

		constructor: `function TextBox() {
			Component.prototype.constructor.apply(this, arguments);
		}`
	)
)