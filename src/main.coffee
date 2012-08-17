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
)

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
				"storage/FileStorage",
				"model/common_application/UndoHistory"],
		(Editor, Deck, FileStorage, UndoHistory) ->
			window.undoHistory = new UndoHistory(20)
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
			"vendor/amd/etch",
			"ui/etch/Templates",
			"css!ui/etch/res/css/etchOverrides.css"],
	(Backbone, DefaultState, etch, EtchTemplates) ->
		Backbone.sync = (method, model, options) ->
			if options.keyTrail?
				options.success(DefaultState.get(options.keyTrail))

			# slightly better than what we were doing before.
			# we need to roll the slide config up into the model.
		window.slideConfig =
			size:
				width: 1024
				height: 768

		_.extend(etch.config.buttonClasses,
			default: ['<group>', 'bold', 'italic', '</group>',
				'<group>', 'justify-left', 'justify-center', 'justify-right', '</group>',
				'<group>', 'link', '</group>',
				'font-family', 'font-size',
				'<group>', 'color', '</group>']
		)

		etch.buttonElFactory = (button) ->
			viewData =
				button: button
				title: button.replace('-', ' ')
				display: button.substring(0, 1).toUpperCase()

			switch button
				when "font-size" then EtchTemplates.fontSizeSelection viewData
				when "font-family" then EtchTemplates.fontFamilySelection viewData
				else 
					if button.indexOf("justify") isnt -1
						console.log button
						viewData.icon = button.substring button.indexOf('-')+1, button.length
						EtchTemplates.align viewData
					else
						EtchTemplates.defaultButton(viewData)

		etch.groupElFactory = () ->
			return $('<div class="btn-group">')
			
		continuation()
	)

	###
	switch (button) {
      case 'font-size':
        return $('<a class="etch-editor-button dropdown-toggle disabled" data-toggle="dropdown" title="'
           + button.replace('-', ' ') + 
           '"><span class="text">Lato</span></a><ul class="dropdown-menu etch-'
            + button + '"><li><a href="#">Wee2</a></li></ul>');
      case 'font-family':
       return $('<a class="etch-editor-button dropdown-toggle disabled" data-toggle="dropdown" title="'
           + button.replace('-', ' ') + 
           '"><span class="text">Lato</span></a><ul class="dropdown-menu etch-'
            + button + '"><li><a href="#">Wee</a></li></ul>');
      break;
      default:
	###