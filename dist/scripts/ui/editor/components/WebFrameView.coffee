###
@author Tantaman
###
define(["./ComponentView"],
(ComponentView) ->
	# TODO: correct scaling
	# TODO: determination of page size...
	ComponentView.extend(
		className: "component webFrameView"
		initialize: () ->
			ComponentView.prototype.initialize.apply(@, arguments)

		render: () ->
			ComponentView.prototype.render.call(@)
			$frame = $("<iframe width='960' height='768' src=#{@model.get('src')}></iframe>")

			@$el.find(".content").append($frame)
			@$el.append('<div class="overlay"></div>')

			scale = @model.get('scale')
			@$el.css(
				width: 960 * scale.x
				height: 768 * scale.y
			)

			@$el
	)
)