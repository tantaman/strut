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

		constructor: `function ButtonBarModel() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}`
	)
)