###
@author Tantaman
###
define(["./ComponentView", './Mixers'],
(ComponentView, Mixers) ->
	# grab a random frame for the thumbnail .. . ?
	# allow scrubbing to find correct thumb?
	Html5 = ComponentView.extend(
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
			$video.append("<source preload='metadata' src='#{@model.get("src")}' type='#{@model.get("srcType")}' />")
			$video.bind("loadedmetadata", => @_finishRender($video))

			@$el.find(".content").append($video)

			@$el
	)

	Youtube = ComponentView.extend(
		className: 'component videoView'
		initialize: () ->
			ComponentView.prototype.initialize.apply(@, arguments)
			@scale = Mixers.scaleObjectEmbed

		render: () ->
			ComponentView.prototype.render.call(@)

			# TODO: this isn't going to scale quite right so we'll have to implement custom scaling for the YT component.
			# It should scale just like an SVG
			# so maybe we can move the SVG scale method into a mixin.
			#frame = '<iframe id="player" type="text/html" width="800" height="600" src="http://www.youtube.com/embed/' + @model.get('src') + '?enablejsapi=1&origin=http://localhost" frameborder="0"></iframe>'

			object = '<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/' + @model.get('shortSrc') + '&hl=en&fs=1"><param name="allowFullScreen" value="true"><embed src="http://www.youtube.com/v/' + @model.get('shortSrc') + '&hl=en&fs=1" type="application/x-shockwave-flash" allowfullscreen="true" width="425" height="344"></object>'

			@$object = $(object)
			@$embed = @$object.find('embed')

			scale = @model.get("scale")
			if scale and scale.width
				@$object.attr(scale)
				@$embed.attr(scale)

			@$el.find('.content').append(@$object) #.append('<div class="overlay"></div>')

			@$el
	)

	types = 
		html5: Html5
		youtube: Youtube

	result =
		create: (params) ->
			new types[params.model.get('videoType')](params)
)