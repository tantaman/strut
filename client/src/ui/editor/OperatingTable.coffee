###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"./Templates",
		"./components/ComponentViewFactory",
		"vendor/keymaster",
		"ui/interactions/CutCopyPasteTrait",
		"model/system/Clipboard"
		"css!./res/css/OperatingTable.css"],
(Backbone, Templates, ComponentViewFactory, Keymaster, CutCopyPasteTrait, Clipboard, empty) ->
	Backbone.View.extend(
		className: "operatingTable"
		events:
			"click": "clicked"
			"focused": "_focus"
		initialize: () ->
			# Set up keymaster events
			CutCopyPasteTrait.applyTo(@, "operatingTable")
			@_clipboard = new Clipboard()

		setModel: (slide) ->
			prevModel = @model
			if @model?
				@model.off(null, null, @)
			@model = slide
			if @model?
				@model.on("change:components.add", @_componentAdded, @)
			# re-render ourselves
			@render(prevModel)

		clicked: (e) ->
			if @model?
				@model.get("components").forEach((component) ->
					if component.get("selected")
						component.set("selected", false)
				)
				@$el.find(".editable").removeClass("editable").attr("contenteditable", false)
					.trigger("editComplete")

			@_focus()

		# looks like we'll need an OperatingTableModel soon...
		cut: () ->
			item = @model.lastSelection
			if (item?)
				@_clipboard.set("item", item)
				@model.remove(item)
				item.set("selected", false)
				false

		copy: () ->
			item = @model.lastSelection
			if (item?)
				newItem = item.clone()
				# TODO: h4x hax
				newItem.set("x", item.get("x") + 25)
				newItem.set("selected", false)
				@_clipboard.set("item", newItem)
				false

		paste: () ->
			if @$el.find(".editable").length isnt 0
				# not in edit mode.  Pretty shitty way to determine that.
				true
			else
				item = @_clipboard.get("item")
				if item?
					@model.add(item.clone())
				false

		_focus: () ->
			if Keymaster.getScope() isnt "operatingTable"
				Keymaster.setScope("operatingTable")

		_componentAdded: (model, component) ->
			view = ComponentViewFactory.createView(component)
			@$el.append(view.render())
			
		render: (prevModel) ->
			if prevModel?
				prevModel.trigger("unrender", true)
			#@$el.html("")
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