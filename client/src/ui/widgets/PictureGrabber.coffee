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
			@cb(@src)
			@$el.modal('hide')

		urlChanged: () ->
			@throttler.submit(@loadImage, {rejectionPolicy: "runLast"})

		loadImage: () ->
			@img.src = @$input.val()
			@src = @img.src

		render: () ->
			@$el.html(Templates.PictureGrabber())
			@$el.modal()
			@$el.modal("hide")
			@img = @$el.find("img")[0]
			@$input = @$el.find("input[name='imageUrl']")
			@$el

		constructor: `function PictureGrabber() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}`
	)
)