###
@author Matt Crinklaw-Vogt
###
define(["common/Throttler",
		"./TextboxDrawer",
		"./ImageModelDrawer"],
(Throttler, TextBoxDrawer, ImageModelDrawer) ->
	class SlideDrawer
		constructor: (@model, @g2d) ->
			@model.on("contentsChanged", @repaint, @)
			@size = 
				width: @g2d.canvas.width
				height: @g2d.canvas.height
			@throttler = new Throttler(600, @)
			@scale = @size.width / slideConfig.size.width

			@drawers =
				TextBox: new TextBoxDrawer(@g2d)
				ImageModel: new ImageModelDrawer(@g2d)

			for key,value of @drawers
				value.scale = @scale

		resized: (newSize) ->
			@size = newSize
			@scale = @size.width / slideConfig.size.width
			for key,value of @drawers
				value.scale = @scale
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

				@drawers[type].paint(component)
				#switch type
				#	when "TextBox" then @paintTextBox(component)
				#	when "ImageModel" then @paintImage(component)
				#	when "Table" then @paintTable(component)
				@g2d.restore()
			)

		dispose: () ->
			@model.off(null, null, @)

)