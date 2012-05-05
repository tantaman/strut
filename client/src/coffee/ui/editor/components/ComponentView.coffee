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
			@model.on("unrender", @_unrender, @)

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

		_unrender: () ->
			console.log "Unrendering"
			@remove(true)
		remove: (keepModel) ->
			Backbone.View.prototype.remove.call(this)
			if not keepModel
				@model.dispose()
			else
				@model.off(null, null, @)

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