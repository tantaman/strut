###
@author Matt Crinklaw-Vogt
###
define(["./ComponentView",
		"../Templates"],
(ComponentView, Templates) ->
	styles = ["family", "size", "weight", "style", "color", "decoration"]
	ComponentView.extend(
		className: "component textBox"
		tagName: "div"
		events: () ->
			parentEvents = ComponentView.prototype.events.call(this)
			myEvents = 
				"dblclick": "dblclicked"
				"editComplete": "editCompleted"
			_.extend(parentEvents, myEvents)

		initialize: () ->
			ComponentView.prototype.initialize.apply(this, arguments)
			for style in styles
				@model.on("change:" + style, @_styleChanged, @)
			#@model.on("change:style", @_styleChanged, @)

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

		_styleChanged: (model, style, opts) ->
			for key,value of opts.changes
				if value
					if key is "decoration"
						console.log "DECORATION CHANGE"
						key = "textDecoration"
					else
						key = "font" + key.substr(0,1).toUpperCase() + key.substr(1)
					console.log key
					console.log style
					@$el.css(key, style)

		render: () ->
			@$el.html(Templates.Component(@model.attributes))
			@$textEl = @$el.find(".content")
			#@$el.text(@model.get("text"))
			@$el.css({
				fontFamily: @model.get("family")
				fontSize: @model.get("size")
				fontWeight: @model.get("weight")
				fontStyle: @model.get("style")
				color: "#" + @model.get("color")
				top: @model.get("y")
				left: @model.get("x")
			})

			@$el
	)
)