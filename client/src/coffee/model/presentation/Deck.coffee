define(["vendor/Backbone", "./SlideCollection"],
(Backbone, SlideCollection) ->
	Backbone.Model.extend(
		initialize: () ->
			@set("slides", new SlideCollection())
	)
)