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

$(() ->
	if (window.location.href.indexOf("preview=") != -1 or $("body > .bg").length > 0)
		requirejs(["ui/preview_export/Templates", "ui/preview_export/impress"],
		(Templates, startImpress) ->
			$head = $("head")
			$head.append(Templates.Head())
			$("body").addClass("impress-not-supported")
			#$head.append('<link href="preview_export/css/main.css" rel="stylesheet" />');

			# TODO:
			# Remove all the stylesheets and scripts and garbage we don't need

			$(->
				alreadyLoaded = ($("body > .bg").length > 0)
				
				if (!alreadyLoaded)
					idx = window.location.href.indexOf("=");
					presentation = window.location.href.substring(idx+1);
					$("body").html(unescape(presentation));

					startImpress(document, window);
					impress().init();
			);
		)
	else
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
					width: 1024
					height: 768
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
)