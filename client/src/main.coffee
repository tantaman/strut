###
@author Tantaman
###
requirejs.config({
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

if not window.localStorage?
	window.localStorage =
		setItem: () ->
		getItem: () ->
		length: 0


requirejs(["vendor/backbone",
		"state/DefaultState"],
(Backbone, DefaultState) ->
	Backbone.sync = (method, model, options) ->
		if options.keyTrail?
			options.success(DefaultState.get(options.keyTrail))

		# slightly better than what we were doing before.
		# we need to roll the slide config up into the model.
	window.slideConfig =
		size:
			width: 960
			height: 720
	continuation()
)

continuation = () ->
	requirejs(["ui/editor/Editor",
			"model/presentation/Deck"],
	(Editor, Deck) ->
		deck = new Deck()
		editor = new Editor({model: deck})

		window.zTracker =
			z: 0
			next: () ->
				++@z

		$("body").append(editor.render())
		deck.newSlide()
	)