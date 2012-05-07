###
@author Matt Crinklaw-Vogt
###
define(["vendor/backbone",
		"ui/widgets/DeltaDragControl",
		"../Templates"
		"css!../res/css/ComponentView.css"],
(Backbone, DeltaDragControl, Templates, empty) ->
	Backbone.View.extend(
		transforms: ["skewX", "skewY", "rotate", "scale"]
		className: "component"
		events: () ->
			"mousedown": "mousedown"
			"click": "clicked"
			"click .removeBtn": "removeClicked"
			"deltadrag span[data-delta='skewX']": "skewX"
			"deltadrag span[data-delta='skewY']": "skewY"
			"deltadrag span[data-delta='rotate']": "rotate"
			"deltadrag span[data-delta='scale']": "scale"

		initialize: () ->
			@_dragging = false
			@allowDragging = true
			@model.on("change:selected", @_selectionChanged, @)
			@model.on("change:color", @_colorChanged, @)
			@model.on("unrender", @_unrender, @)

			@_mouseup = @stopdrag.bind(@)
			@_mousemove = @mousemove.bind(@)
			$(document).bind("mouseup", @_mouseup)
			$(document).bind("mousemove", @_mousemove)

			@_deltaDrags = []

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

		skewX: (e, deltas) ->
			skew = @model.get("skewX")
			@model.set("skewX", skew + Math.atan2(deltas.dx, 22))
			@_setUpdatedTransform()

		skewY: (e, deltas) ->
			skew = @model.get("skewY")
			@model.set("skewY", skewY + Math.atan2(deltas.dy, 22))
			@_setUpdatedTransform()

		rotate: (e, deltas) ->
			rot = @model.get("rotate")
			@model.set("rotate", rot + Math.atan2(deltas.dy, deltas.dx))
			@_setUpdatedTransform()

		scale: (e, deltas) ->


		_setUpdatedTransform: () ->
			transformStr = @buildTransformString()
			obj =
				transform: transformStr
			obj[window.browserPrefix + "transform"] = transformStr
			@$content.css(obj)

		buildTransformString: () ->
			transformStr = ""
			@transforms.forEach((transformName) =>
				transformValue = @model.get(transformName)
				if transformValue
					transformStr += transformName + "(" + transformValue + "rad) "
			)
			transformStr

		mousedown: (e) ->
			@_dragging = true
			@_prevPos = {
				x: e.pageX
				y: e.pageY
			}

		render: () ->
			@$el.html(Templates.Component(@model.attributes))
			@$el.find("span[data-delta]").each((idx, elem) =>
				deltaDrag = new DeltaDragControl($(elem), true)
				@_deltaDrags.push(deltaDrag)
			)
			@$content = @$el.find(".content")
			@_setUpdatedTransform()
			@$el

		_unrender: () ->
			console.log "Unrendering"
			@remove(true)

		remove: (keepModel) ->
			Backbone.View.prototype.remove.call(this)
			for idx,deltaDrag of @_deltaDrags
				deltaDrag.dispose()
			if not keepModel
				@model.dispose()
			else
				@model.off(null, null, @)

			$doc = $(document)
			$doc.unbind("mouseup", @_mouseup)
			$doc.unbind("mousemove", @_mousemove)

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
			true

	)
)