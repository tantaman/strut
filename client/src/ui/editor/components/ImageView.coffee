###
@author Tantaman
###
define(["./ComponentView"],
(ComponentView) ->

	svgScale = (e, deltas) ->
		offset = @$el.offset()
		width = (deltas.x - offset.left) / @dragScale
		height = (deltas.y - offset.top) / @dragScale
		@$el.css(
			width: width
			height: height
		)
		@model.set("scale", {width: width, height: height})

	ComponentView.extend(
		className: "component imageView"
		tagName: "div"
		initialize: () ->
			ComponentView.prototype.initialize.apply(@, arguments)
			if @model.get("imageType") is "SVG"
				@scale = svgScale

		render: () ->
			ComponentView.prototype.render.call(@)
			$img = $("<img src=#{@model.get('src')}></img>")
			
			if @model.get("imageType") is "SVG"
				$img.css(
					width: "100%"
					height: "100%"
				)
				naturalWidth = $img[0].naturalWidth
				naturalHeight = $img[0].naturalHeight

				scale = @model.get("scale")
				if scale
					@$el.css(
						width: scale.width
						height: scale.height
					)
				else
					@$el.css(
						width: naturalWidth
						height: naturalHeight
					)
					@model.set("scale", {width: naturalWidth, height: naturalHeight})

			$img.bind("dragstart", (e) -> e.preventDefault(); false)
			@$el.find(".content").append($img);
			@$el.css({
				top: @model.get("y")
				left: @model.get("x")
			})
			@$el
	)
)