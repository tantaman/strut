define(["vendor/amd/Handlebars",
		"./Templates"],
(Handlebars, Templates) ->
	class ImpressRenderer
		constructor: () ->
			Handlebars.registerHelper("renderComponent", (componentModel) =>
				result = ""

				switch componentModel.get("type")
					when "ImageModel"
						if componentModel.get("imageType") is "SVG"
							result = Templates.SVGImage(componentModel.attributes)
						else
							result = Templates.Image(componentModel.attributes)
					when "TextBox" then result = Templates
						.TextBox(@convertTextBoxData(componentModel.attributes))
					when "Video"
						result = Templates.Video(componentModel.attributes)

				new Handlebars.SafeString(result)
			)


			Handlebars.registerHelper("scaleX", (x) ->
				x * slideConfig.size.width / 150 # TODO FIXME
			)

			Handlebars.registerHelper("scaleY", (y) ->
				y * slideConfig.size.width / 150 # TODO FIXME
			)

			Handlebars.registerHelper("toDeg", (v) ->
				v * 180 / Math.PI
			)

			Handlebars.registerHelper("negate", (v) ->
				-1 * v
			)

			Handlebars.registerHelper("extractBG", (styles) ->
				if styles? and styles.length > 0
					result = ""
					style = styles[0]
					browsers = [
						"-moz-",
						"-webkit-",
						"-o-",
						"-ms-",
						""
					]

					for prefix in browsers
						result += "background-image: " + prefix + style + "; "

					result
				else
					""
			)

			Handlebars.registerPartial("ComponentContainer", Templates.ComponentContainer)
			Handlebars.registerPartial("TransformContainer", Templates.TransformContainer)
			Handlebars.registerPartial("SVGContainer", Templates.SVGContainer)

		render: (deckAttrs) ->
			slides = deckAttrs.slides
			colCnt = 6
			cnt = 0
			# TODO FIXME
			slides.each((slide) =>
				x = slide.get("x")
				if not x?
					slide.set("x", cnt * 160 + 30)
					slide.set("y", ((cnt / colCnt) | 0) * 160 + 80)
				++cnt)
			Templates.ImpressTemplate(deckAttrs)

		convertTextBoxData: (attrs) ->
			copy = _.extend({}, attrs)
			copy.text = new Handlebars.SafeString(attrs.text)
			copy

	new ImpressRenderer()
)