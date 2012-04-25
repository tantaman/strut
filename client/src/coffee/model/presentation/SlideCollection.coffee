define(["vendor/Backbone", "./Slide"],
(Backbone, Slide) ->
	Backbone.Collection.extend(
		model: Slide
	)
)