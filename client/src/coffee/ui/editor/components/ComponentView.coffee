define(["vendor/backbone"],
(Backbone) ->
	Backbone.View.extend(
		events: () ->
			"mousedown": "mousedown"
			"mousemove": "mousemove"
			"mouseup": "stopdrag"
			"mouseout": "stopdrag"
			"click": "clicked"
			"click .removeBtn": "removeClicked"

		initialize: () ->
			@_dragging = false
			@allowDragging = true
			@model.on("change:selected", @_selectionChanged, @)
			@model.on("change:color", @_colorChanged, @)

		_selectionChanged: (model, selected) ->
			if selected
				@$el.addClass("selected")
			else
				@$el.removeClass("selected")

		_colorChanged: (model, color) ->
			@$el.css("color", "#" + color)

		clicked: (e) ->
			@model.set("selected", true)
			e.stopPropagation()

		removeClicked: (e) ->
			e.stopPropagation()
			@remove()

		mousedown: (e) ->
			@_dragging = true
			@_prevPos = {
				x: e.pageX
				y: e.pageY
			}

		remove: () ->
			Backbone.View.prototype.remove.call(this)
			@model.dispose()

		mousemove: (e) ->
			if @_dragging and @allowDragging
				x = @model.get("x")
				y = @model.get("y")
				dx = e.pageX - @_prevPos.x
				dy = e.pageY - @_prevPos.y
				newX = x + dx
				newY = y + dy
				@model.set("x", newX)
				@model.set("y", newY)
				@$el.css({
					left: newX
					top: newY
				})
				@_prevPos.x = e.pageX
				@_prevPos.y = e.pageY

		stopdrag: () ->
			@_dragging = false

	)
)