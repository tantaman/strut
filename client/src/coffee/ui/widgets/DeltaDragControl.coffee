define(() ->
	events = ["mousedown", "mousemove", "mouseup"]
	class DragControl
		constructor: (@$el, @stopProp) ->
			@dragging = false
			@_mousemove = @mousemove.bind(@)
			@_mouseup = @mouseup.bind(@)
			@_mouseout = @_mouseup
			$(document).bind("mousemove", @_mousemove)
			$(document).bind("mouseup", @_mouseup)
			#$(document).bind("mouseout", @_mouseout)
			@$el.bind("mousedown", @mousedown.bind(@))
			@$el.bind("mouseup", @_mouseup)

		dispose: () ->
			$(document).unbind("mousemove", @_mousemove)
			$(document).unbind("mouseup", @_mouseup)
			#$(document).unbind("mouseout", @_mouseout)

		mousedown: (e) ->
			@dragging = true
			if @stopProp
				e.stopPropagation()

		mousemove: (e) ->
			if @dragging
				myPos = @$el.offset()
				pos =
					x: e.pageX
					y: e.pageY
				dx = pos.x - myPos.left
				dy = pos.y - myPos.top
				@$el.trigger("deltadrag", [{dx: dx, dy: dy}])
				if @stopProp
					e.stopPropagation()

		mouseup: (e) ->
			@dragging = false
			true
)