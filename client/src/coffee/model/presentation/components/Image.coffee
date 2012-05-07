define(["./Component"],
(Component) ->
	Component.extend(
		constructor: `function ImageModel() {
			Component.prototype.constructor.apply(this, arguments);
		}`
	)
)