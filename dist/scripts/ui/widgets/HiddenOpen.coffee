define(['backbone'],
(Backbone) ->
	Backbone.View.extend(
		className: 'disp-none'
		events:
			"change input[type='file']": '_fileChosen'

		initialize: (triggerElem, cb) ->
			@_cb = cb
			if triggerElem?
				triggerElem.on('click', @trigger.bind(@))

		trigger: (cb) ->
			if cb?
				@_cb = cb
			@$input.click()

		_fileChosen: (e) ->
			f = e.target.files[0]
			@_cb(f)

		render: ->
			@$input = $('<input type="file"></input>')
			@$el.html(@$input)
	)
)