define(["libs/Handlebars",
		"common/Math2"],
(Handlebars, Math2) ->
	class ImpressRenderer
		constructor: () ->
			Handlebars.registerHelper("renderComponent", (componentModel) =>
				result = ""

				switch componentModel.get("type")
					when "ImageModel"
						if componentModel.get("imageType") is "SVG"
							result = JST["impress_rednerer/SVGImage"](componentModel.attributes)
						else
							result = JST["impress_rednerer/Image"](componentModel.attributes)
					when "TextBox" then result = 
						JST["impress_rednerer/TextBox"](@convertTextBoxData(componentModel.attributes))
					when "Video"
						if componentModel.get("videoType") is "html5"
							result = JST["impress_rednerer/Video"](componentModel.attributes)
						else
							result = JST["impress_rednerer/Youtube"](componentModel.attributes)
					when "WebFrame"
						result = JST["impress_rednerer/WebFrame"](componentModel.attributes)

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

			Handlebars.registerHelper("round", (v) ->
				Math2.round(v, 2)
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

			Handlebars.registerPartial("ComponentContainer", JST["impress_rednerer/ComponentContainer"])
			Handlebars.registerPartial("TransformContainer", JST["impress_rednerer/TransformContainer"])
			Handlebars.registerPartial("SVGContainer", JST["impress_rednerer/SVGContainer"])

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
			JST["impress_rednerer/ImpressTemplate"](deckAttrs)

		convertTextBoxData: (attrs) ->
			copy = _.extend({}, attrs)
			copy.text = new Handlebars.SafeString(attrs.text)
			copy

	new ImpressRenderer()
)