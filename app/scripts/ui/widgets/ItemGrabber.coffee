###
@author Matt Crinklaw-Vogt
###
define(["vendor/amd/backbone",
		"./Templates",
		"common/Throttler"],
(Backbone, Templates, Throttler) ->
	Backbone.View.extend(
		className: "itemGrabber modal"
		events:
			"click .ok": "okClicked"
			"click div[data-option='browse']": "browseClicked"
			"change input[type='file']": "fileChosen"
			"keyup input[name='itemUrl']": "urlChanged"
			"paste input[name='itemUrl']": "urlChanged"
			"hidden": "hidden"

		initialize: () ->
			@throttler = new Throttler(200, @)

		show: (cb) ->
			@cb = cb
			@$el.modal('show')

		okClicked: () ->
			if !@$el.find(".ok").hasClass("disabled")
				@cb(@src)
				@$el.modal('hide')

		fileChosen: (e) ->
			f = e.target.files[0]

			if (!f.type.match('image.*'))
				return

			reader = new FileReader()

			reader.onload = (e) =>
								@$input.val(e.target.result)
								@urlChanged(which: -1)

			reader.readAsDataURL(f)

		browseClicked: () ->
			@$el.find('input[type="file"]').click()

		hidden: () ->
			if @$input?
				@$input.val("")

		urlChanged: (e) ->
			if e.which is 13
				@src = @$input.val()
				@okClicked()
			else
				@throttler.submit(@loadItem, {rejectionPolicy: "runLast"})

		loadItem: () ->
			@item.src = @$input.val()
			@src = @item.src

		_itemLoadError: ->
			@$el.find(".ok").addClass("disabled")
			@$el.find(".alert").removeClass("disp-none")

		_itemLoaded: ->
			@$el.find(".ok").removeClass("disabled")
			@$el.find(".alert").addClass("disp-none")

		render: () ->
			@$el.html(Templates.ItemGrabber(@options))
			@$el.modal()
			@$el.modal("hide")
			@item = @$el.find(@options.tag)[0]

			if (@options.tag == "video")
				@$el.find(".modal-body").prepend("<div class='alert alert-success'>Supports <strong>webm & YouTube</strong>.<br/>Try out: http://www.youtube.com/watch?v=vHUsdkmr-SM</div>")

			if !@options.ignoreErrors
				@item.onerror = => @_itemLoadError()
				@item.onload = => @_itemLoaded()
			
			@$input = @$el.find("input[name='itemUrl']")
			@$el

		constructor: `function ItemGrabber() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}`
	)
)