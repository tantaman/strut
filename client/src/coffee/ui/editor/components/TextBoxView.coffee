define(["./ComponentView",
		"../Templates"],
(ComponentView, Templates) ->
	ComponentView.extend(
		className: "component textBox"
		tagName: "div"
		styles: ["fontFamily", "fontSize", "fontWeight", "fontStyle", "color"]
		events: () ->
			parentEvents = ComponentView.prototype.events.call(this)
			myEvents = 
				"dblclick": "dblclicked"
				"editComplete": "editCompleted"
			_.extend(parentEvents, myEvents)

		initialize: () ->
			ComponentView.prototype.initialize.apply(this, arguments)

		dblclicked: (e) ->
			@$el.addClass("editable").attr("contenteditable", true)
			@allowDragging = false

		editCompleted: () ->
			text = @$textEl.text()
			if text is ""
				@remove()
			else
				@model.set("text", text)
				@allowDragging = true

		render: () ->
			@$el.html(Templates.Component(@model.attributes))
			@$textEl = @$el.find(".content")
			#@$el.text(@model.get("text"))
			@$el.css({
				fontFamily: @model.get("family")
				fontSize: @model.get("size")
				fontWeight: @model.get("weight")
				fontStyle: @model.get("style")
				color: @model.get("color")
				top: @model.get("y")
				left: @model.get("x")
			})

			@$el
	)
)