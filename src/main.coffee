###
@author Tantaman
###
requirejs.config(
	paths:
		"css": "vendor/amd_plugins/css"
		"text": "vendor/amd_plugins/text"
	shim: 
		'vendor/amd/jszip': 
			exports: 'JSZip'
		'vendor/amd/jszip-deflate': ['vendor/amd/jszip']
		'vendor/amd/jquery-1.7-matt':
			exports: 'jQuery'
		'vendor/amd/jqueryUI': ['vendor/amd/jquery-1.7-matt']
		'vendor/amd/underscore':
			exports: '_'
		'vendor/amd/bootstrap': ['vendor/amd/jquery-1.7-matt']
		'vendor/amd/bootstrapDropdown': ['vendor/amd/bootstrap', 'vendor/amd/jquery-1.7-matt']
		'../res/jqplugins/colorpicker/js/colorpicker': ['vendor/amd/jquery-1.7-matt']
		'../res/jqplugins/gradient_picker/jquery.gradientPicker': ['vendor/amd/jquery-1.7-matt']
		'vendor/amd/backbone':
			exports: 'Backbone'
			deps: ['vendor/amd/underscore', 'vendor/amd/jquery-1.7-matt']
)

if not window.localStorage?
	window.localStorage =
		setItem: () ->
		getItem: () ->
		length: 0

if not Function.bind? or Function.prototype.bind?
	Function.prototype.bind = (ctx) ->
		fn = this
		() ->
			fn.apply(ctx, arguments)

if window.location.href.indexOf("preview=true") isnt -1
	# do nothing...
else
	continuation = () ->
		requirejs(["ui/editor/Editor",
				"model/presentation/Deck",
				"storage/FileStorage"],
		(Editor, Deck, FileStorage) ->
			deck = new Deck()
			editor = new Editor({model: deck})

			window.zTracker =
				z: 0
				next: () ->
					++@z

			$("body").append(editor.render())

			lastPres = localStorage.getItem("StrutLastPres")
			if lastPres?
				pres = FileStorage.open(lastPres)
				if pres?
					deck.import(pres)
			
			if not lastPres?
				deck.newSlide()
		)
	
	requirejs(["vendor/amd/backbone",
			"state/DefaultState",
			"vendor/amd/jquery-1.7-matt",
			"vendor/amd/bootstrapDropdown",
			"vendor/amd/jqueryUI",
			"../res/jqplugins/colorpicker/js/colorpicker",
			"../res/jqplugins/gradient_picker/jquery.gradientPicker"],
	(Backbone, DefaultState, jQuery) ->
		Backbone.sync = (method, model, options) ->
			if options.keyTrail?
				options.success(DefaultState.get(options.keyTrail))

			# slightly better than what we were doing before.
			# we need to roll the slide config up into the model.
		window.slideConfig =
			size:
				width: 1024
				height: 768

		`jQuery.fn.selectText = function(){
		    var doc = document;
		    var element = this[0];
		    if (doc.body.createTextRange) {
		        var range = document.body.createTextRange();
		        range.moveToElementText(element);
		        range.select();
		    } else if (window.getSelection) {
		        var selection = window.getSelection();        
		        var range = document.createRange();
		        range.selectNodeContents(element);
		        selection.removeAllRanges();
		        selection.addRange(range);
		    }
		    return this;
		};`

		$ = jQuery
		window.browserPrefix = ""
		if $.browser.mozilla
			window.browserPrefix = "-moz-"
		else if $.browser.msie
			window.browserPrefix = "-ms-"
		else if $.browser.opera
			window.browserPrefix = "-o-"
		else if $.browser.webkit
			window.browserPrefix = "-webkit-"

		continuation()
	)