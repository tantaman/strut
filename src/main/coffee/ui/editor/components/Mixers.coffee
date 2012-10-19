define( ->
	mixers = 
		scaleByResize: (e, deltas) ->
			offset = @$el.offset()
			width = (deltas.x - offset.left) / @dragScale
			height = (deltas.y - offset.top) / @dragScale
			@$el.css(
				width: width
				height: height
			)
			@model.set("scale", {width: width, height: height})

		scaleObjectEmbed: (e, deltas) ->
			offset = @$el.offset()
			width = (deltas.x - offset.left) / @dragScale
			height = (deltas.y - offset.top) / @dragScale
			size = width: width, height: height
			@$object.attr(size)
			@$embed.attr(size)
			@model.set("scale", size)
)