###
@author Matt Crinklaw-Vogt
###
define(["vendor/amd/backbone"
		"ui/widgets/DeltaDragControl"
		"../Templates"
		"common/Math2"
		"css!../res/css/ComponentView.css"],
# TODO:
# Start pushing more of this functionality down into a model
(Backbone, DeltaDragControl, Templates, Math2, empty) ->
	Backbone.View.extend(
		transforms: ["skewX", "skewY"]
		className: "component"
		# TODO: make this junk less verbose
		# and more common
		events: () ->
			"mousedown": "mousedown"
			"click": "clicked"
			"click .removeBtn": "removeClicked"
			"change input[data-option='x']": "manualMoveX"
			"change input[data-option='y']": "manualMoveY"
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
			@model.on("change:selected", @__selectionChanged, @)
			@model.on("change:color", @_colorChanged, @)
			@model.on("unrender", @_unrender, @)

			@_mouseup = @stopdrag.bind(@)
			@_mousemove = @mousemove.bind(@)
			$(document).bind("mouseup", @_mouseup)
			$(document).bind("mousemove", @_mousemove)

			@_deltaDrags = []

			@model.on("rerender", @_setUpdatedTransform, @)
			@model.on("change:x", @_xChanged, @)
			@model.on("change:y", @_yChanged, @)

			@_lastDeltas = 
				dx: 0
				dy: 0

		__selectionChanged: (model, selected) ->
			if selected
				@$el.addClass("selected")
			else
				@$el.removeClass("selected")

		_colorChanged: (model, color) ->
			@$el.css("color", "#" + color)

		_xChanged: (model, value) ->
			@$el.css("left", value)
			@$xInput.val(value)

		_yChanged: (model, value) ->
			@$el.css("top", value)
			@$yInput.val(value)

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

		manualMoveX: (e) ->
			@model.setInt("x", e.target.value)

		manualMoveY: (e) ->
			@model.setInt("y", e.target.value)

		rotate: (e, deltas) ->
			rot = @_calcRot(deltas) 
				#((Math.pow(deltas.x, 2) + Math.pow(deltas.y, 2)) / Math.pow(1000, 2)) * (Math.PI*2)
			@model.set("rotate", @_initialRotate + rot - @_rotOffset)
			@_setUpdatedTransform()

		rotateStart: (e, deltas) ->
			@updateOrigin()
			@_rotOffset = @_calcRot(deltas)
			@_initialRotate = @model.get("rotate") || 0

		updateOrigin: () ->
			offset = @$el.offset()
			@_origin = 
				x: @$el.width() / 2 + offset.left
				y: @$el.height() / 2 + offset.top

		_calcRot: (point) ->
			Math.atan2(point.y - @_origin.y, point.x - @_origin.x)

		scaleStart: (e) ->
			@dragScale = @$el.parent().css(window.browserPrefix + "transform")
			@dragScale = parseFloat(@dragScale.substring(7, @dragScale.indexOf(","))) or 1
			# TEMPORARY! until the video element is updated
			if not @origSize?
				@origSize =
					width: @$el.width()
					height: @$el.height()

		scale: (e, deltas) ->
			offset = @$el.offset()

			rot = @model.get("rotate")
			if rot
				deltas = Math2.transformPt(deltas, rot)
				offset = Math2.transformPtE(offset, rot)
			#console.log deltas.x + " " + deltas.y
			
			newWidth = Math.abs(deltas.x - offset.left) / @dragScale
			newHeight = Math.abs(deltas.y - offset.top) / @dragScale

			scale =
				x: newWidth / @origSize.width
				y: newHeight / @origSize.height
				width: newWidth
				height: newHeight

			@model.set("scale", scale)
			@_setUpdatedTransform()

		_setUpdatedTransform: () ->
			transformStr = @buildTransformString()
			obj =
				transform: transformStr
			obj[window.browserPrefix + "transform"] = transformStr
			@$content.css(obj)

			# TODO: add scale to root obj and invert scale on labels?
			scale = @model.get("scale")
			if @origSize?
				newWidth = scale.width or @origSize.width
				newHeight = scale.height or @origSize.height
				@$el.css(
					width: newWidth
					height: newHeight)

			if scale?
				@$contentScale.css(window.browserPrefix + "transform", "scale(" + scale.x + "," + scale.y + ")") 
			@$el.css(window.browserPrefix + "transform", "rotate(" + @model.get("rotate") + "rad)")

		buildTransformString: () ->
			transformStr = ""
			@transforms.forEach((transformName) =>
				transformValue = @model.get(transformName)
				if transformValue
					#if transformName is "scale"
						#transformStr += transformName + "(" + transformValue + ") "
					#else
					transformStr += transformName + "(" + transformValue + "rad) "
			)
			transformStr

		mousedown: (e) ->
			@model.set("selected", true)
			@$el.css("zIndex", zTracker.next())
			@dragScale = @$el.parent().css(window.browserPrefix + "transform")
			@dragScale = parseFloat(@dragScale.substring(7, @dragScale.indexOf(","))) or 1
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
			@$contentScale = @$el.find(".content-scale")
			#@_setUpdatedTransform()

			@__selectionChanged(@model, @model.get("selected"))

			@$xInput = @$el.find("[data-option='x']")
			@$yInput = @$el.find("[data-option='y']")

			@$el.css({
				top: @model.get("y")
				left: @model.get("x")
			})

			size = 
				width: @$el.width()
				height: @$el.height()

			if size.width > 0 and size.height > 0
				@origSize = size
			@_setUpdatedTransform()

			@$el

		#_fixScaling: (scale) ->
		#	pos = @$el.position()
		#	width = @$el.width() * scale
		#	height = @$el.height() * scale
		#	dw = width - @$el.width()
		#	dh = height - @$el.height()
		#	@$el.css(
		#			width: width
		#			height: height
		#			left: pos.left - dw / 2
		#			top: pos.top - dh / 2
		#		);

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
				newX = x + dx / @dragScale
				newY = y + dy / @dragScale

				@model.set("x", newX)
				@model.set("y", newY)
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