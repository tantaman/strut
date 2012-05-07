###
@author Matt Crinklaw-Vogt
###
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
			@_startPos =
				x: e.pageX
				y: e.pageY
			@$el.trigger("deltadragStart", {x: e.pageX, y: e.pageY})
			if @stopProp
				e.stopPropagation()

		mousemove: (e) ->
			if @dragging
				dx = e.pageX - @_startPos.x
				dy = e.pageY - @_startPos.y
				@$el.trigger("deltadrag", [{dx: dx, dy: dy, x: e.pageX, y: e.pageY}])
				if @stopProp
					e.stopPropagation()

		mouseup: (e) ->
			@dragging = false
			true
)