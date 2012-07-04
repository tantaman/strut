###
@author Tantaman
###
define(["./Component", "common/FileUtils"],
(Component, FileUtils) ->
	Component.extend(
		initialize: () ->
			Component.prototype.initialize.apply(this, arguments)
			@set("type", "WebFrame")			

		constructor: `function WebFrame() {
			Component.prototype.constructor.apply(this, arguments);
		}`
	)
)