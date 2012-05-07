define(["./Component"],
(Component) ->
	Component.extend(
		constructor: `ImageModel() {
			Component.prototype.constructor.apply(this, arguments);
		}`
	)
)