define(["./AbstractDrawer"],
(AbstractDrawer) ->
	reg = /<[^>]+>|<\/[^>]+>/
	class TextBoxDrawer extends AbstractDrawer
		constructor: (@g2d) ->

		paint: (textBox) ->
			@g2d.fillStyle = "#" + textBox.get("color")
			lineHeight = textBox.get("size")*@scale
			@g2d.font = lineHeight + "px " + textBox.get("family")

			lines = @_extractLines(textBox.get("text"))
			txtWidth = @_findWidestWidth(lines) * @scale

			bbox =
				x: textBox.get("x") * @scale
				y: textBox.get("y") * @scale
				width: txtWidth + txtWidth # Hmm... why the heck do I ahve to do this?
				height: textBox.get("size") * @scale

			@applyTransforms(textBox, bbox)

			cnt = 0
			lines.forEach((line) =>
				if line isnt ""		
					@g2d.fillText(line, bbox.x, bbox.y + bbox.height + cnt * lineHeight)
					++cnt
			)

		_extractLines: (text) ->
			# hmm..  We'll get some incorrect behavior on Chrome.
			text.split(reg)

		_findWidestWidth: (lines) ->
			widestWidth = 0
			lines.forEach((line) =>
				width = @g2d.measureText(line).width
				if width > widestWidth
					widestWidth = width
			)

			widestWidth

)