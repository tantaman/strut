###
@author Matt Crinklaw-Vogt
###
define(["common/Throttler"],
(Throttler) ->
	class SlideDrawer
		### TODO: how she we handle slide sizes and scaling?
		# Fixed slide size?  Slide size = size of editor . . . ?
		# We'll have to re-visit this when we start testing the impress export.
		###
		haxTempSlideSize =
			width: 1024
			height: 768

		constructor: (@model, @g2d) ->
			@model.on("change", @repaint, @)
			@size = 
				width: @g2d.canvas.width
				height: @g2d.canvas.height
			console.log @size
			@throttler = new Throttler(600, @)
			@scale = @size.width / haxTempSlideSize.width

		resized: (newSize) ->
			@size = newSize
			@scale = @size.width / haxTempSlideSize.width
			@repaint()

		repaint: () ->
			# Should throttle down repaint events
			@throttler.submit(@paint, {
				rejectionPolicy: "runLast"
			})

		paint: () ->
			@g2d.save()
			@g2d.clearRect(0,0,@size.width,@size.height)
			components = @model.get("components")
			components.forEach((component) =>
				type = component.constructor.name
				switch type
					when "TextBox" then @paintTextBox(component)
					when "Image" then @paintImage(component)
					when "Table" then @paintTable(component)
					when "Image" then @paintImage(component)
			)
			@g2d.restore()

		paintTextBox: (textBox) ->
			@g2d.fillStyle = "#" + textBox.get("color")
			@g2d.font = textBox.get("size")*@scale + "px " + textBox.get("family")
			@g2d.fillText(textBox.get("text"), textBox.get("x") * @scale, textBox.get("y") * @scale + textBox.get("size") * @scale)

		paintImage: () ->

		paintTable: () ->

		paintImage: () ->

		dispose: () ->
			@model.off("change", @repaint, @)

)