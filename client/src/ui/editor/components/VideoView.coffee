###
@author Tantaman
###
define(["./ComponentView"],
(ComponentView) ->
	# grab a random frame for the thumbnail .. . ?
	# allow scrubbing to find correct thumb?
	ComponentView.extend(
		className: "component videoView"
		initialize: () ->
			ComponentView.prototype.initialize.apply(@, arguments)

		render: () ->
			ComponentView.prototype.render.call(@)
			$video = $("<video src=#{@model.get('src')}></video>")
			@$el.find(".content").append($video)

			@$el
	)
)