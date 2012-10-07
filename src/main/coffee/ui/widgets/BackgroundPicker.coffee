define(["vendor/amd/backbone",
		"./Templates",
		"css!./res/css/BackgroundPicker.css"]
(Backbone, Templates, empty) ->
	gradOptions =
		type: (value) ->
			@_updatePicker(type: value)

		direction: (value) ->
			@_updatePicker(fillDirection: value)

	Backbone.View.extend(
		className: "backgroundPicker modal"
		events:
			"click .ok": "okClicked"
			"click [data-option]": "optionChosen"

		initialize: () ->

		show: (cb, bgOpts) ->
			@$el.modal("show")

			if bgOpts?
				@_updatePicker(bgOpts);

			@cb = cb

		_updatePicker: (bgOpts) ->
			@$gradientPicker.gradientPicker("update", bgOpts)

		_updateGradientPreview: (styles) ->
			@$gradientPreview.css("background-image", styles[0]);
			@$gradientPreview.css("background-image", styles[1]);

		okClicked: () ->
			@$el.modal("hide")
			@cb(@$gradientPicker.gradientPicker("currentState"))

		optionChosen: (e) ->
			option = e.currentTarget.dataset.option
			value = e.target.dataset.value
			gradOptions[option].call(@, value)


		render: () ->
			@$el.html(Templates.BackgroundPicker())
			@$el.modal()

			@$gradientPicker = @$el.find(".gradientPicker")
			@$gradientPreview = @$el.find(".gradientPreview")

			bgOpts = @options.bgOpts or {}
			bgOpts.change = (points, styles) =>
				@_updateGradientPreview(styles)

			@$gradientPicker.gradientPicker(bgOpts)

			@$el.modal("hide")
			@$el.find(".dropdown-toggle").dropdown()

			@$el
	)
)