###
@author Matt Crinklaw-Vogt
###
define(["common/Calcium", "./Slide"],
(Backbone, Slide) ->
	slideComparator = (l, r) ->
		l.get("num") - r.get("num")

	Backbone.Collection.extend(
		model: Slide
		initialize: () ->
			@on("add", @_updateNumbers, @)
			@on("remove", @_updateNumbers, @)

		_updateNumbers: () ->
			@models.forEach((model, idx) ->
				model.set("num", idx)
			)

		sort: (opts) ->
			opts or (opts = {})
			@models.sort(slideComparator)
			console.log @models
	)
)