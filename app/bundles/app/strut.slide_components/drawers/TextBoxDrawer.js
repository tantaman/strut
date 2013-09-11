define(["./AbstractDrawer"],
	function(AbstractDrawer) {
		var TextBoxDrawer, newlineReg, spaceReg, tagReg;
		newlineReg = /<br>/;
		spaceReg = /&nbsp;/g;
		tagReg = /<[^>]+>|<\/[^>]+>/g;

		return TextBoxDrawer = (function(_super) {

			__extends(TextBoxDrawer, _super);

			/**
			 * Drawer for text components.
			 *
			 * @param {CanvasRenderingContext2D} g2d
			 * @constructor
			 * @extends AbstractDrawer
			 * @see SlideDrawer
			 */
			function TextBoxDrawer(g2d) {
				AbstractDrawer.apply(this, arguments);
				this.g2d = g2d;
			}

			/**
			 * Paints text box on canvas.
			 *
			 * @param {TextBox} textBoxModel
			 * @see SlideDrawer._paint
			 */
			TextBoxDrawer.prototype.paint = function(textBoxModel) {
				var bbox, lineHeight, lines, text, txtWidth;
				this.g2d.fillStyle = "#" + textBoxModel.get("color");
				lineHeight = textBoxModel.get("size") * this.scale.y;
				this.g2d.font = lineHeight + "px " + textBoxModel.get("family");
				text = this._convertSpaces(textBoxModel.get("text"));
				lines = this._extractLines(text);
				txtWidth = this._findWidestWidth(lines) * this.scale.x;
				txtWidth *= 3;
				bbox = {
					x: textBoxModel.get("x") * this.scale.x,
					y: textBoxModel.get("y") * this.scale.y + lineHeight * this.scale.y,
					width: txtWidth,
					height: lineHeight * lines.length * this.scale.y
				};

				this.applyTransforms(textBoxModel, bbox);
				lines.forEach(function(line, i) {
					this._renderLine(line, i, bbox, lineHeight);
				}, this);
			};

			/**
			 * Converts space character codes (such as &nbsp;) into one-char space.
			 *
			 * @param {String} text
			 * @returns {String}
			 * @private
			 */
			TextBoxDrawer.prototype._convertSpaces = function(text) {
				return text.replace(spaceReg, " ");
			};

			/**
			 * Produces array of text strings broken down by new line character.
			 *
			 * @param {String} text
			 * @returns {String[]}
			 * @private
			 */
			TextBoxDrawer.prototype._extractLines = function(text) {
				return text.split(newlineReg);
			};

			/**
			 * Returns widest string from a given array of strings.
			 *
			 * @param {String[]} lines
			 * @returns {number}
			 * @private
			 */
			TextBoxDrawer.prototype._findWidestWidth = function(lines) {
				var widestWidth,
					_this = this;
				widestWidth = 0;
				lines.forEach(function(line) {
					var width;
					width = _this.g2d.measureText(line.replace(tagReg, "")).width;
					if (width > widestWidth) {
						widestWidth = width;
					}
				});
				return widestWidth;
			};

			/**
			 * Renders line of text.
			 *
			 * @param {String} line
			 * @param {Number} cnt
			 * @param {{x: int, y:int, width: int, height: int}} bbox
			 * @param {Number} lineHeight
			 * @private
			 */
			TextBoxDrawer.prototype._renderLine = function(line, cnt, bbox, lineHeight) {
				if (line !== "") {
					line = line.replace(tagReg, "");
					this.g2d.fillText(line, bbox.x, bbox.y + bbox.height + cnt * lineHeight);
					++cnt;
				}
			};

			return TextBoxDrawer;

		})(AbstractDrawer);
	});
