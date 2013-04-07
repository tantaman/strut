define(["./AbstractDrawer"],
(AbstractDrawer) ->
	newlineReg = /<[^>]+>|<\/[^>]+>/
	spaceReg = /&nbsp;/g
	class TextBoxDrawer extends AbstractDrawer
		constructor: (@g2d) ->

		paint: (textBox) ->
			@g2d.fillStyle = "#" + textBox.get("color")
			lineHeight = textBox.get("size")*@scale.y
			@g2d.font = lineHeight + "px " + textBox.get("family")

			text = @_convertSpaces(textBox.get("text"))
			lines = @_extractLines(text)
			txtWidth = @_findWidestWidth(lines) * @scale.x

			bbox =
				x: textBox.get("x") * @scale.x
				y: textBox.get("y") * @scale.y
				width: txtWidth + txtWidth # Hmm... why the heck do I ahve to do this?
				height: textBox.get("size") * @scale.y

			@applyTransforms(textBox, bbox)

			cnt = 0
			lines.forEach((line) =>
				if line isnt ""		
					@g2d.fillText(line, bbox.x, bbox.y + bbox.height + cnt * lineHeight)
					++cnt
			)

		_extractLines: (text) ->
			# hmm..  We'll get some incorrect behavior on Chrome.
			text.split(newlineReg)

		_convertSpaces: (text) ->
			text.replace(spaceReg, " ")

		_findWidestWidth: (lines) ->
			widestWidth = 0
			lines.forEach((line) =>
				width = @g2d.measureText(line).width
				if width > widestWidth
					widestWidth = width
			)

			widestWidth

)