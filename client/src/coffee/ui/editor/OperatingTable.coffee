define(["vendor/backbone", "./Templates",
		"./components/ComponentViewFactory"],
(Backbone, Templates, ComponentViewFactory) ->
	Backbone.View.extend(
		className: "operatingTable"
		initialize: () ->

		setModel: (slide) ->
			if @model?
				@model.off("change:components.add", @_componentAdded, @)
			@model = slide
			if @model?
				@model.on("change:components.add", @_componentAdded, @)
			# re-render ourselves
			@render()

		_componentAdded: (model, component) ->
			console.log("Comp added")
			view = ComponentViewFactory.createView(component)
			@$el.append(view.render())
			
		render: () ->
			@$el.html("")
			#@$el.html(Templates.OperatingTable(@model))
			if @model?
				components = @model.get("components")
				components.forEach((component) =>
					view = ComponentViewFactory.createView(component)
					@$el.append(view.render())
				)
			@$el
	)
)