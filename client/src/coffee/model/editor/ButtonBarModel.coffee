define(["vendor/backbone"],
(Backbone) ->
	Backbone.Model.extend(
		initialize: () ->
			@fetch({keyTrail: ["editor", "slideEditor", "buttonBar"]})
		constructor: `function ButtonBarModel() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)