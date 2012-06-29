###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./Templates",
		"common/Throttler"],
(Backbone, Templates, Throttler) ->
	Backbone.View.extend(
		className: "pictureGrabber modal"
		events:
			"click .ok": "okClicked"
			"keyup input[name='imageUrl']": "urlChanged"
			"paste input[name='imageUrl']": "urlChanged"

		initialize: () ->
			@throttler = new Throttler(200, @)

		show: (cb) ->
			@cb = cb
			@$el.modal('show')

		okClicked: () ->
			if !@$el.find(".ok").hasClass("disabled")
				@cb(@src)
				@$el.modal('hide')

		urlChanged: () ->
			@throttler.submit(@loadImage, {rejectionPolicy: "runLast"})

		loadImage: () ->
			@img.src = @$input.val()
			@src = @img.src

		_imgLoadError: ->
			@$el.find(".ok").addClass("disabled")
			@$el.find(".alert").removeClass("disp-none")

		_imgLoaded: ->
			@$el.find(".ok").removeClass("disabled")
			@$el.find(".alert").addClass("disp-none")

		render: () ->
			@$el.html(Templates.PictureGrabber())
			@$el.modal()
			@$el.modal("hide")
			@img = @$el.find("img")[0]
			@img.onerror = => @_imgLoadError()
			@img.onload = => @_imgLoaded()
			@$input = @$el.find("input[name='imageUrl']")
			@$el

		constructor: `function PictureGrabber() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}`
	)
)