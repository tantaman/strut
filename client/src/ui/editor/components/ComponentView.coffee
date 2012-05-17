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
		# TODO: make this junk less verbose
		# and more common
		events: () ->
			"mousedown": "mousedown"
			"click": "clicked"
			"click .removeBtn": "removeClicked"
			"deltadrag span[data-delta='skewX']": "skewX"
			"deltadrag span[data-delta='skewY']": "skewY"
			"deltadrag span[data-delta='rotate']": "rotate"
			"deltadrag span[data-delta='scale']": "scale"
			"deltadragStart span[data-delta='skewX']": "skewXStart"
			"deltadragStart span[data-delta='skewY']": "skewYStart"
			"deltadragStart span[data-delta='rotate']": "rotateStart"
			"deltadragStart span[data-delta='scale']": "scaleStart"

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

			@model.on("rerender", @_setUpdatedTransform, @)

		_selectionChanged: (model, selected) ->
			if selected
				@$el.addClass("selected")
			else
				@$el.removeClass("selected")

		_colorChanged: (model, color) ->
			@$el.css("color", "#" + color)

		clicked: (e) ->
			@$el.trigger("focused")
			e.stopPropagation()
			false

		removeClicked: (e) ->
			e.stopPropagation()
			@remove()

		skewX: (e, deltas) ->
			@model.set("skewX", @_initialSkewX + Math.atan2(deltas.dx, 22))
			@_setUpdatedTransform()

		skewXStart: () ->
			@_initialSkewX = @model.get("skewX") || 0

		skewY: (e, deltas) ->
			@model.set("skewY", @_initialSkewY + Math.atan2(deltas.dy, 22))
			@_setUpdatedTransform()

		skewYStart: () ->
			@_initialSkewY = @model.get("skewY") || 0

		rotate: (e, deltas) ->
			rot = Math.atan2(deltas.y - @_origin.y, deltas.x - @_origin.x)
			@model.set("rotate", @_initialRotate + rot - @_rotOffset)
			@_setUpdatedTransform()

		rotateStart: (e, deltas) ->
			@updateOrigin()
			@_rotOffset = @_calcRot(deltas)
			@_initialRotate = @model.get("rotate") || 0

		updateOrigin: () ->
			@_origin = 
				x: @$el.width() / 2 + @model.get("x")
				y: @$el.height() / 2 + @model.get("y")

		_calcRot: (point) ->
			Math.atan2(point.y - @_origin.y, point.x - @_origin.x)

		scale: (e, deltas) ->
			contentWidth = @$content.width()
			contentHeight = @$content.height()
			newWidth = contentWidth + deltas.dx
			newHeight = contentHeight + deltas.dy

			scale = (newWidth*newHeight) / (contentWidth*contentHeight)

			@model.set("scale", scale * @_initialScale)
			@_setUpdatedTransform()

		scaleStart: () ->
			@_initialScale = @model.get("scale") || 1

		_setUpdatedTransform: () ->
			transformStr = @buildTransformString()
			obj =
				transform: transformStr
			obj[window.browserPrefix + "transform"] = transformStr
			@$content.css(obj)

			# TODO: just use the transform matrix...
		buildTransformString: () ->
			transformStr = ""
			@transforms.forEach((transformName) =>
				transformValue = @model.get(transformName)
				if transformValue
					if transformName is "scale"
						transformStr += transformName + "(" + transformValue + ") "
					else
						transformStr += transformName + "(" + transformValue + "rad) "
			)
			transformStr

		mousedown: (e) ->
			@model.set("selected", true)
			@_dragging = true
			@_prevPos = {
				x: e.pageX
				y: e.pageY
			}

		render: () ->
			@$el.html(@__getTemplate()(@model.attributes))
			@$el.find("span[data-delta]").each((idx, elem) =>
				deltaDrag = new DeltaDragControl($(elem), true)
				@_deltaDrags.push(deltaDrag)
			)
			@$content = @$el.find(".content")
			@_setUpdatedTransform()

			@_selectionChanged(@model, @model.get("selected"))

			@$el

		__getTemplate: () ->
			Templates.Component

		_unrender: () ->
			@remove(true)

		remove: (keepModel) ->
			Backbone.View.prototype.remove.call(this)
			for idx,deltaDrag of @_deltaDrags
				deltaDrag.dispose()
			if not keepModel
				@model.dispose()
				@model.off(null, null, @)
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

		constructor: `function ComponentView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}`
	)
)