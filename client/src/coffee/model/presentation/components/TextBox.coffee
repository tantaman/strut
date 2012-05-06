###
@author Matt Crinklaw-Vogt
###
define(["./Component"],
(Component) ->
	Component.extend(
		initialize: () ->
			if not @get("text")?
				@set("text", "Text")
		constructor: `function TextBox() {
			Component.prototype.constructor.apply(this, arguments);
		}`
	)
)