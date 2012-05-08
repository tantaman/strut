###
@author Matt Crinklaw-Vogt
###
define(["common/Calcium", "./Slide"],
(Backbone, Slide) ->
	Backbone.Collection.extend(
		model: Slide
		initialize: () ->
			@on("add", @_updateNumbers, @)
			@on("remove", @_updateNumbers, @)

		_updateNumbers: () ->
			@models.forEach((model, idx) ->
				model.set("num", idx)
			)
	)
)