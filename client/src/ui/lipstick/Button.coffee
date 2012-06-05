define(["vendor/backbone"],
(Backbone) ->
	defaults =
		template: (model) ->
			@label()

	# provide own tpl
	# provide label options
	# don't allow event binding?  Extend button to get events instead?
	# or...  provide event delegate to mix in?


	# Don't pass in field but data-bind it via the template?
	# Need a way to intercept change events then...
	# Well what if we want to make it in code w/o a new template and
	# data-bind attribute?
	Backbone.View.extend(
		tagName: "button"
		className: "btn"

		events: () ->
			"click": "click"

		initialize: () ->
			_.defaults(@options, defaults)
			@template = @options.template

			@_bind()

		_bind: () ->
			@$el.bind("destroyed", @_dipose.bind(@))

		click: (e) ->
			@trigger("click", e)

		label: () ->
			if @options.label?
				result = @options.label
			else if @options.field?
				result = @model.get(@options.field)

			if @options.formatter?
				result = @options.formatter(result)

			result

		dispose: () ->
			if @model?
				@model.off(null, null, @)

		render: () ->
			@$el.html(@template.call(@, @model))
	)
)