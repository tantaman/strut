###
@author Matt Crinklaw-Vogt
###
define(["common/Throttler"],
(Throttler) ->
	class SlideDrawer

		constructor: (@model, @g2d) ->
			@model.on("contentsChanged", @repaint, @)
			@size = 
				width: @g2d.canvas.width
				height: @g2d.canvas.height
			@throttler = new Throttler(600, @)
			@scale = @size.width / slideConfig.size.width

		resized: (newSize) ->
			@size = newSize
			@scale = @size.width / slideConfig.size.width
			@repaint()

		repaint: () ->
			# Should throttle down repaint events
			@throttler.submit(@paint, {
				rejectionPolicy: "runLast"
			})

		paint: () ->
			@g2d.clearRect(0,0,@size.width,@size.height)
			components = @model.get("components")

			components.forEach((component) =>
				type = component.get("type")

				@g2d.save()
				###
				# TODO: figure out correct translation to apply after transforms
				skewX = component.get("skewX")
				skewY = component.get("skewY")
				transform = [1,0,0,1,0,0]
				if skewX
					transform[1] = skewX
				if skewY
					transform[2] = skewY
				@g2d.transform.apply(@g2d, transform)

				rotate = component.get("rotate")
				if rotate
					@g2d.rotate(rotate)###

				switch type
					when "TextBox" then @paintTextBox(component)
					when "ImageModel" then @paintImage(component)
					when "Table" then @paintTable(component)
				@g2d.restore()
			)

		paintTextBox: (textBox) ->
			@g2d.fillStyle = "#" + textBox.get("color")
			@g2d.font = textBox.get("size")*@scale + "px " + textBox.get("family")

			txtWidth = @g2d.measureText(textBox.get("text")).width * @scale
			bbox =
				x: textBox.get("x") * @scale
				y: textBox.get("y") * @scale
				width: txtWidth + txtWidth # Hmm... why the heck do I ahve to do this?
				height: textBox.get("size") * @scale

			@applyTransforms(textBox, bbox)
			@g2d.fillText(textBox.get("text"), bbox.x, bbox.y + bbox.height)

		paintImage: (imageModel) ->
			@_imageLoaded(imageModel.cachedImage, imageModel)

		_imageLoaded: (image, imageModel) ->
			bbox =
				x: imageModel.get("x") * @scale
				y: imageModel.get("y") * @scale
				width: image.naturalWidth * @scale
				height: image.naturalHeight * @scale
			
			@applyTransforms(imageModel, bbox)

			@g2d.drawImage(image, bbox.x,
								  bbox.y,
								  bbox.width,
								  bbox.height)

		applyTransforms: (component, bbox) ->
			rotation = component.get("rotate")
			@g2d.translate(bbox.width/2 + bbox.x, bbox.height/2 + bbox.y)

			if rotation?
				@g2d.rotate(rotation)

			scale = component.get("scale")
			if scale?
				@g2d.scale(scale, scale)

			skewX = component.get("skewX")
			skewY = component.get("skewY")
			if skewX or skewY
				transform = [1,0,0,1,0,0]
				if skewX
					transform[2] = skewX
				if skewY
					transform[1] = skewY
				@g2d.transform.apply(@g2d, transform)
			
			@g2d.translate(-1 * (bbox.width/2 + bbox.x), -1 * (bbox.height/2 + bbox.y))

		paintTable: () ->

		dispose: () ->
			@model.off(null, null, @)

)