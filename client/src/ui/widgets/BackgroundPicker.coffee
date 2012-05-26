define(["vendor/backbone",
		"./Templates",
		"css!./res/css/BackgroundPicker.css"]
(Backbone, Templates, empty) ->
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
			@cb(@$gradientPicker.gradientPicker("currentState"))

		optionChosen: () ->

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

			@$el
	)
)