define(["vendor/backbone", "./Slide"],
(Backbone, Slide) ->
	Backbone.Collection.extend(
		model: Slide
	)
)