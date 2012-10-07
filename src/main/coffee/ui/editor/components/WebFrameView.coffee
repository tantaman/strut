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
			$frame = $("<iframe src=#{@model.get('src')}></iframe>")
			@$el.find(".content").append($frame)

			@$el
	)
)