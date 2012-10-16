###
@author Tantaman
###
define(["./Component", "common/FileUtils"],
(Component, FileUtils) ->
	Video = Component.extend(
		initialize: () ->
			Component.prototype.initialize.apply(this, arguments)
			@set("type", "Video")

			for matcher in matchers
				regResult = matcher.reg.exec @get('src')
				console.log regResult
				if regResult?
					@_handleMatch(regResult, matcher)
					break

			@

		_handleMatch: (regResult, matcher) ->
			@set('shortSrc', regResult[1])
			@set('videoType', matcher.type)
			@set('srcType', matcher.srcType(regResult[1]))

		constructor: `function Video() {
			Component.prototype.constructor.apply(this, arguments);
		}`
	)

	matchers = [
		{
			type: 'youtube'
			reg: /youtube\.com\/.*v=(.*?)(&|$)/
			srcType: () -> 'yt'
		}
		{
			type: 'html5'
			reg: /(.*)/
			srcType: (src) -> FileUtils.type(FileUtils.extension(src))
		}
		#{
		#	type: 'vimeo'
		#	reg: ''
		#}
	]

	Video
)