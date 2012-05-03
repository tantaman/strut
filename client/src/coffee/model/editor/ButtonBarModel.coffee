define(["vendor/backbone"],
(Backbone) ->
	Backbone.Model.extend(
		initialize: () ->
			@fetch({keyTrail: ["editor", "slideEditor", "buttonBar"]})

		fontConfig: () ->
			# marshall up the font configuration...
			# for our text box...

		constructor: `function ButtonBarModel() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)