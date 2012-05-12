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

			swapped = {}
			@models.forEach((model,idx) =>
				num = model.get("num")
				if num isnt idx and not swapped[num]
					swapped[num] = true
					swapped[idx] = true
					@_swapTransitionPositions(model, @models[num])
			)

			@models.sort(slideComparator)

		_swapTransitionPositions: (l, r) ->
			tempPosData = l.getPositionData()
			silent =
				silent: true
			l.set(r.getPositionData(), silent)
			r.set(tempPosData, silent)
	)
)