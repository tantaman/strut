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
				@$el.find(".modal-body").prepend("<div class='alert alert-success'>Supports <strong>mp4, webm</strong>.<br/>Try out: http://clips.vorwaerts-gmbh.de/VfE_html5.mp4 <br/>or: http://media.w3.org/2010/05/sintel/trailer.mp4</div>")

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