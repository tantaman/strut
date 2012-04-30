requirejs.config({
	"packages": ["ui/editor", "model/presentation"],
	paths: {
		"css": "vendor/amd_plugins/css",
		"text": "vendor/amd_plugins/text"
	}
})

requirejs(["ui/editor",
			"model/presentation"],
(Editor, presentation) ->

	deck = new presentation.Deck()
	editor = new Editor({model: deck})

	$("body").append(editor.render())
)