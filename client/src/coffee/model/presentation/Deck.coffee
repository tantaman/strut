define(["vendor/Backbone", "./SlideCollection",
		"./Slide"],
(Backbone, SlideCollection, Slide) ->
	Backbone.Model.extend(
		initialize: () ->
			@set("slides", new SlideCollection())
			

		newSlide: () ->
			slides = @get("slides")
			slides.add(new Slide({num: slides.length}))
	)
)