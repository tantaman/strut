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