define(["handlebars", "common/Math2", "marked", "strut/deck/Utils"],
function(Handlebars, Math2, marked, DeckUtils) {
	var ImpressGenerator;
	var slideConfig = window.config.slide;

	ImpressGenerator = (function() {

		function ImpressGenerator() {
			var _this = this;
			Handlebars.registerHelper("renderComponent", function(componentModel, ignore) {
				var result;
				result = "";
				if (ignore && typeof ignore == 'string') {
					ignore = ignore.split(" ");
					if (ignore.indexOf(componentModel.get("type")) != -1)
						return result;
				}
				switch (componentModel.get("type")) {
					case "Image":
						if (componentModel.get("imageType") === "SVG") {
							result = JST["strut.presentation_generator.impress/SVGImage"](componentModel.attributes);
						} else {
							result = JST["strut.presentation_generator.impress/Image"](componentModel.attributes);
						}
						break;
					case "TextBox":
						result = JST["strut.presentation_generator.impress/TextBox"](_this.convertTextBoxData(componentModel.attributes));
						break;
					case "Video":
						if (componentModel.get("videoType") === "html5") {
							result = JST["strut.presentation_generator.impress/Video"](componentModel.attributes);
						} else {
							result = JST["strut.presentation_generator.impress/Youtube"](componentModel.attributes);
						}
						break;
					case "WebFrame":
						result = JST["strut.presentation_generator.impress/WebFrame"](componentModel.attributes);
						break;
					case "Shape":
						result = JST["strut.presentation_generator.impress/Shape"](componentModel.attributes);
						break;
				}
				return new Handlebars.SafeString(result);
			});
			Handlebars.registerHelper("scaleX", function(x) {
				return x * slideConfig.size.width / slideConfig.overviewSize.width;
			});
			Handlebars.registerHelper("scaleY", function(y) {
				return y * slideConfig.size.height / slideConfig.overviewSize.height;
			});
			Handlebars.registerHelper("toDeg", function(v) {
				return v * 180 / Math.PI;
			});
			Handlebars.registerHelper("negate", function(v) {
				return -1 * v;
			});
			Handlebars.registerHelper("round", function(v) {
				return Math2.round(v, 2);
			});
			Handlebars.registerHelper("extractBG", function(styles) {
				var browsers, prefix, result, style, _i, _len;
				if ((styles != null) && styles.length > 0) {
					result = "";
					style = styles[0];
					browsers = ["-moz-", "-webkit-", "-o-", "-ms-", ""];
					for (_i = 0, _len = browsers.length; _i < _len; _i++) {
						prefix = browsers[_i];
						result += "background-image: " + prefix + style + "; ";
					}
					return result;
				} else {
					return "";
				}
			});

			Handlebars.registerHelper("or", function(a, b) {
				return a || b;
			});

			Handlebars.registerHelper("determineBG", function(slide, deck) {
				var bg = DeckUtils.slideBackground(slide, deck, {surfaceForDefault: true, transparentForSurface: true});
				if (bg && bg.indexOf('img:') == 0)
					return '';
				return bg;
			});

			Handlebars.registerHelper("determineSurface", function(slide, deck) {
				var bg = DeckUtils.slideSurface(slide, deck);
				if (bg && bg != 'bg-default' && bg.indexOf('img:') == -1)
					return ' ' + bg + ' ';
				return '';
			});

			Handlebars.registerHelper("slideBGImg", function(slide) {
				var bg = slide.get('background');
				if (bg && bg.indexOf('img:') == 0)
					return 'background-image: url(' + bg.substring(4) + ');';
				return '';
			});

			Handlebars.registerHelper("marked", function(string) {
				if (string)
					return new Handlebars.SafeString(marked(string));
				return '';
			});

			Handlebars.registerHelper("shapeSvg", function() {
				var attr_insert = '';
				var retval = '';
				if (this.markup) {
					if (this.fill) {
						attr_insert += ' fill="' + this.fill + '" ';
					}
					if (this.scale) {
						attr_insert += ' height="' + this.scale.height + '" ';
						attr_insert += ' width="'  + this.scale.width  + '" ';
					}
					retval = new Handlebars.SafeString(this.markup.replace('<svg ', '<svg ' + attr_insert));
				}
				return retval;
			});

			Handlebars.registerHelper("isBGImg", function(string, options) {
				if (string && string.indexOf("img:") == 0) {
					return options.fn(this);
				} else {
					return options.inverse(this);
				}
			});

			Handlebars.registerHelper("isBGClass", function(string, options) {
				if (string && string.indexOf("img:") == 0) {
					return options.inverse(this);
				} else {
					return options.fn(this);
				}
			});

			Handlebars.registerHelper("getBGImgStyle", function(string) {
				return 'background-image: url(' + string.substring(4) + ');';
			});

			var counters = {};
			Handlebars.registerHelper("counter_set", function(name, val) {
				counters[name] = val;
			});

			Handlebars.registerHelper("counter_incAndGet", function(name) {
				return (counters[name] = counters[name] + 1);
			});

			Handlebars.registerPartial("ComponentContainer", JST["strut.presentation_generator.impress/ComponentContainer"]);
			Handlebars.registerPartial("TransformContainer", JST["strut.presentation_generator.impress/TransformContainer"]);
			Handlebars.registerPartial("SVGContainer", JST["strut.presentation_generator.impress/SVGContainer"]);
			Handlebars.registerPartial("PerSlideSurfaceStylesheet", JST["strut.presentation_generator/PerSlideSurfaceStylesheet"]);
			Handlebars.registerPartial("CustomBgStylesheet", JST["strut.presentation_generator/CustomBgStylesheet"]);
		}

		ImpressGenerator.prototype.render = function(deck) {
			var cnt, colCnt, slides,
				_this = this;
			var deckAttrs = deck.attributes;
			slides = deckAttrs.slides;
			colCnt = 6;
			cnt = 0;

			var minX, minY, maxX, maxY;

			slides.each(function(slide) {
				var x;
				x = slide.get("x");
				y = slide.get('y');
				if (!(x != null)) {
					slide.set("x", cnt * 280 + 180);
					slide.set("y", ((cnt / colCnt) | 0) * 280 + 180);
				}

				if (minX == null || x < minX)
					minX = x;
				if (minY == null || y < minY)
					minY = y;
				if (maxX == null || x > maxX)
					maxX = x;
				if (maxY == null || y > maxY)
					maxY = y;

				return ++cnt;
			});

			deckAttrs.overviewX = (maxX + minX) / 2;
			deckAttrs.overviewY = (maxY + minY) / 2;

			return JST["strut.presentation_generator.impress/ImpressTemplate"](deck);
		};

		ImpressGenerator.prototype.getStartPreviewFn = function(editorModel, sourceWind, previewStr) {
			function cb() {
				console.log('Loaded!');
				window.location.hash = '#/step-' + (editorModel.activeSlideIndex() + 1);
				sourceWind.previewWind.document.open();
				sourceWind.
						previewWind.document.write(previewStr);
				sourceWind.previewWind.document.close();
			}

			return cb;
		};

		ImpressGenerator.prototype.convertTextBoxData = function(attrs) {
			var copy;
			copy = _.extend({}, attrs);
			copy.text = new Handlebars.SafeString(attrs.text);
			return copy;
		};

		return ImpressGenerator;

	})();
	return new ImpressGenerator();
});
