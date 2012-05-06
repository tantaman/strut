###
@author Matt Crinklaw-Vogt
###
requirejs.config({
	"packages": ["ui/editor", "model/presentation"],
	paths: {
		"css": "vendor/amd_plugins/css",
		"text": "vendor/amd_plugins/text"
	}
})

window.browserPrefix = ""
if $.browser.mozilla
	window.browserPrefix = "-moz-"
else if $.browser.msie
	window.browserPrefix = "-ms-"
else if $.browser.opera
	window.browserPrefix = "-o-"
else if $.browser.webkit
	window.browserPrefix = "-webkit-"

requirejs(["vendor/backbone",
			"state/DefaultState"],
(Backbone, DefaultState) ->
	Backbone.sync = (method, model, options) ->
		if options.keyTrail?
			options.success(DefaultState.get(options.keyTrail))

	continuation()
)

continuation = () ->
	requirejs(["ui/editor",
			"model/presentation"],
	(Editor, presentation) ->

		deck = new presentation.Deck()
		editor = new Editor({model: deck})

		$("body").append(editor.render())
	)