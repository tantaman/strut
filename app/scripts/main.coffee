# Set the require.js configuration for your application.
require.config({

  # Initialize the application with the main application file.
  deps: ["main"],

  paths: {
    # JavaScript folders.
    libs: "../scripts/libs",
    plugins: "../scripts/plugins",

    # Libraries.
    jquery: "../scripts/libs/jQuery",
    lodash: "../scripts/libs/lodash",
    backbone: "../scripts/libs/backbone",
    css: "../scripts/plugins/css",
    text: "../scripts/plugins/text",
    bootstrap: "../components/bootstrap/bootstrap.js",
    bootstrapDropdown: "../components/bootstrap/bootstrapDropdown",
    colorpicker: "../components/colorpicker/js/colorpicker",
    gradientPicker: "../components/gradient_picker/jquery.gradientPicker",
    # impress to correctly render previews
    impress: "../preview_Export/scripts/impress.js",
    downloadify: "../components/downloadify/js/downloadify.min.js",
    swfobject: "../components/downloadify/js/swfobject.js"
  },

  shim: {
    # Backbone library depends on lodash and Zepto.
    backbone: {
      deps: ["lodash", "jquery"],
      exports: "Backbone"
    },

    bootstrap: {
      deps: ["jquery"]
    },

    bootstrapDropdown: {
      deps: ["boostrap", "jquery"]
    },

    colorpicker: {
      deps: ["jquery"]
    },

    gradientPicker: {
      deps: ["jquery", "colorpicker"]
    }
  }
})


window.browserPrefix = ""

window.URL = window.webkitURL or window.URL
window.Blob = window.Blob or window.WebKitBlob or window.MozBlob

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
  
  requirejs(["backbone",
      "state/DefaultState",
      "libs/etch",
      "ui/etch/Templates",
      "jquery",
      "css!styles/ui/etch/etchOverrides.css"],
  (Backbone, DefaultState, etch, EtchTemplates, $) ->
    Backbone.sync = (method, model, options) ->
      if options.keyTrail?
        options.success(DefaultState.get(options.keyTrail))

    if $.browser.mozilla
        window.browserPrefix = "-moz-"
    else if $.browser.msie
        window.browserPrefix = "-ms-"
    else if $.browser.opera
        window.browserPrefix = "-o-"
    else if $.browser.webkit
        window.browserPrefix = "-webkit-"

    $.fn.selectText = -> 
        doc = document
        element = @[0]
        if (doc.body.createTextRange)
            range = document.body.createTextRange()
            range.moveToElementText(element)
            range.select()
        else if (window.getSelection)
            selection = window.getSelection()
            range = document.createRange()
            range.selectNodeContents(element)
            selection.removeAllRanges()
            selection.addRange(range)
        @

    window.slideConfig =
      size:
        width: 1024
        height: 768

    _.extend(etch.config.buttonClasses,
      default: [
        '<group>', 'bold', 'italic', '</group>',
        '<group>', 'unordered-list', 'ordered-list', '</group>',
        '<group>', 'justify-left', 'justify-center', '</group>',
        '<group>', 'link', '</group>',
        'font-family', 'font-size',
        '<group>', 'color', '</group>']
    )

    etch.buttonElFactory = (button) ->
      viewData =
        button: button
        title: button.replace('-', ' ')
        display: button.substring(0, 1).toUpperCase()

      if button is 'link' or button is 'clear-formatting' or button is 'ordered-list' or button is 'unordered-list'
        viewData.display = ''

      switch button
        when "font-size" then EtchTemplates.fontSizeSelection viewData
        when "font-family" then EtchTemplates.fontFamilySelection viewData
        when "color" then EtchTemplates.colorChooser viewData
        else 
          if button.indexOf("justify") isnt -1
            viewData.icon = button.substring button.indexOf('-')+1, button.length
            EtchTemplates.align viewData
          else
            EtchTemplates.defaultButton(viewData)

    etch.groupElFactory = () ->
      return $('<div class="btn-group">')
      
    continuation()
  )