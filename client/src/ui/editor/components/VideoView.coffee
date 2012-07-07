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

		_finishRender: ($video) ->
			@origSize =
				width: $video[0].videoWidth
				height: $video[0].videoHeight
			@_setUpdatedTransform()

		render: () ->
			ComponentView.prototype.render.call(@)

			$video = $("<video controls></video>")
			$video.append("<source preload='metadata' src='#{@model.get("src")}' type='#{@model.get("videoType")}' />")
			$video.bind("loadedmetadata", => @_finishRender($video))

			@$el.find(".content").append($video)

			@$el
	)
)