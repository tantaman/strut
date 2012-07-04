###
@author Tantaman
###
define(["./Component", "common/FileUtils"],
(Component, FileUtils) ->
	Component.extend(
		initialize: () ->
			Component.prototype.initialize.apply(this, arguments)
			@set("type", "Video")			

		constructor: `function Video() {
			Component.prototype.constructor.apply(this, arguments);
		}`
	)
)