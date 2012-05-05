define(["vendor/backbone", "./Templates",
		"./components/ComponentViewFactory",
		"css!./res/css/OperatingTable.css"],
(Backbone, Templates, ComponentViewFactory, empty) ->
	Backbone.View.extend(
		className: "operatingTable"
		events:
			"click": "clicked"
		initialize: () ->

		setModel: (slide) ->
			if @model?
				@model.off("change:components.add", @_componentAdded, @)
			@model = slide
			if @model?
				@model.on("change:components.add", @_componentAdded, @)
			# re-render ourselves
			@render()

		clicked: (e) ->
			if @model?
				@model.get("components").forEach((component) ->
					if component.get("selected")
						component.set("selected", false)
				)
				@$el.find(".editable").removeClass("editable").attr("contenteditable", false)
					.trigger("editComplete")

		_componentAdded: (model, component) ->
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