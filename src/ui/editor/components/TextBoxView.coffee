###
@author Tantaman
###
define(["./ComponentView",
		"../Templates"],
(ComponentView, Templates) ->
	styles = ["family", "size", "weight", "style", "color", "decoration", "align"]
	ComponentView.extend(
		className: "component textBox"
		tagName: "div"
		events: () ->
			parentEvents = ComponentView.prototype.events.call(@)
			myEvents = 
				"dblclick": "dblclicked"
				"editComplete": "editCompleted"
			_.extend(parentEvents, myEvents)

		initialize: () ->
			ComponentView.prototype.initialize.apply(@, arguments)
			for style in styles
				@model.on("change:" + style, @_styleChanged, @)
			@_lastDx = 0
			@model.on("edit", @edit, @)
			#@model.on("change:style", @_styleChanged, @)


		scaleStart: () ->
		
		scale: (e, deltas) ->
			currSize = @model.get("size")

			sign = if deltas.dx - @_lastDx > 0 then 1 else -1
			@model.set("size", currSize + Math.round(sign*Math.sqrt(Math.abs(deltas.dx - @_lastDx))))
			@_lastDx = deltas.dx

		dblclicked: (e) ->
			@$el.addClass("editable")
			@$el.find(".content").attr("contenteditable", true) #selectText()
			@allowDragging = false
			@editing = true

		editCompleted: () ->
			text = @$textEl.html()
			@editing = false
			if text is ""
				@remove()
			else
				@model.set("text", text)
				@$el.find(".content").attr("contenteditable", false)
				@$el.removeClass("editable")
				@allowDragging = true

		__selectionChanged: (model, selected) ->
			ComponentView.prototype.__selectionChanged.apply(@, arguments)
			if not selected and @editing
				@editCompleted()

		edit: () ->
			@model.set("selected", true)
			@dblclicked()
			@$el.find(".content").selectText()

		_styleChanged: (model, style, opts) ->
			for key,value of opts.changes
				if value
					if key is "decoration" or key is "align"
						console.log "DECORATION CHANGE"
						key = "text" + key.substring(0,1).toUpperCase() + key.substr(1)
					else if key isnt "color"
						key = "font" + key.substr(0,1).toUpperCase() + key.substr(1)
					@$el.css(key, style)

		render: () ->
			ComponentView.prototype.render.call(@)
			@$textEl = @$el.find(".content")
			@$textEl.html(@model.get("text"))
			@$el.css({
				fontFamily: @model.get("family")
				fontSize: @model.get("size")
				fontWeight: @model.get("weight")
				fontStyle: @model.get("style")
				color: "#" + @model.get("color")
				top: @model.get("y")
				left: @model.get("x")
				textDecoration: @model.get("decoration")
				textAlign: @model.get("align")
			})

			@$el

		constructor: `function TextBoxView() {
			ComponentView.prototype.constructor.apply(this, arguments);
		}`
	)
)