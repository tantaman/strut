define(["libs/backbone",
	"tantaman/web/widgets/DeltaDragControl",
	"common/Math2",
	"css!styles/slide_components/ComponentView.css",
	"strut/editor/GlobalEvents",
	"strut/deck/ComponentCommands",
	"tantaman/web/undo_support/CmdListFactory",
	"tantaman/web/interactions/TouchBridge"],
	function(Backbone, DeltaDragControl, Math2, empty, key, ComponentCommands, CmdListFactory, TouchBridge) {
		var undoHistory = CmdListFactory.managedInstance('editor');

		/**
		 * @class ComponentView
		 * @augments Backbone.View
		 */
		return Backbone.View.extend({
			transforms: ["skewX", "skewY"],
			className: "component",

			/**
			 * Returns list of events, tracked by this view.
			 *
			 * @returns {Object}
			 */
			events: function() {
				return {
					'select': '_selected',
					'unselect': '_unselected',
					"click": "clicked",
					"click .removeBtn": "removeClicked",
					"change input[data-option='x']": "manualMoveX",
					"change input[data-option='y']": "manualMoveY",
					"deltadragStart span[data-delta='skewX']": "skewXStart",
					"deltadrag span[data-delta='skewX']": "skewX",
					"deltadragStop span[data-delta='skewX']": "skewXStop",
					"deltadragStart span[data-delta='skewY']": "skewYStart",
					"deltadrag span[data-delta='skewY']": "skewY",
					"deltadragStop span[data-delta='skewY']": "skewYStop",
					"deltadragStart span[data-delta='rotate']": "rotateStart",
					"deltadrag span[data-delta='rotate']": "rotate",
					"deltadragStop span[data-delta='rotate']": "rotateStop",
					"deltadragStart span[data-delta='scale']": "scaleStart",
					"deltadrag span[data-delta='scale']": "scale",
					"deltadragStop span[data-delta='scale']": "scaleStop",
					'destroyed': 'remove',
					'click .align': 'center'
				}
			},

			/**
			 * Initialize component view.
			 */
			initialize: function() {
				this._dragging = false;
				this.allowDragging = true;
				this.model.on("change:selected", this._selectionChanged, this);
				this.model.on("change:color", this._colorChanged, this);
				this.model.on("unrender", this._unrender, this);
				this._mouseup = this.mouseup.bind(this);
				this._mousemove = this.mousemove.bind(this);
				this.mousedown = this.mousedown.bind(this);
				this._deltaDrags = [];
				this.model.on("rerender", this._setUpdatedTransform, this);
				this.model.on("change:x", this._xChanged, this);
				this.model.on("change:y", this._yChanged, this);
				this.model.on("change:skewX", this._setUpdatedTransform, this);
				this.model.on("change:skewY", this._setUpdatedTransform, this);
				this.model.on("change:rotate", this._setUpdatedTransform, this);
				this.model.on("change:scale", this._setUpdatedTransform, this);
				this.model.on('change:customClasses', this._updateCustomClasses, this);

				this.model.on("dragStart", this.dragStart, this);
				this.model.on("drag", this.drag, this);
				this.model.on("dragStop", this.dragStop, this);

				this.$el.css('z-index', zTracker.next());
				this._lastDeltas = {
					dx: 0,
					dy: 0
				};

				this._toDispose = [];
				var $doc = $(document);
				this._toDispose.push(TouchBridge.on.mouseup($doc, this._mouseup));
				this._toDispose.push(TouchBridge.on.mousemove($doc, this._mousemove));

				TouchBridge.on.mousedown(this.$el, this.mousedown);
			},

			/**
			 * React on color change.
			 *
			 * @param {Component} model
			 * @param {string} color
			 * @private
			 */
			_colorChanged: function(model, color) {
				this.$el.css("color", "#" + color);
			},


			/**
			 * React on click event. Boost element's z-index to bring it front while editing.
			 *
			 * @param {Event} e
			 */
			clicked: function(e) {
				this.$el.css('z-index', zTracker.next());
				this.$el.trigger("focused");
				e.stopPropagation();
				return false;
			},

			/**
			 * React on clicking X remove button.
			 *
			 * @param {Event} e
			 */
			removeClicked: function(e) {
				e.stopPropagation();
				if (this.model.slide) {
					this.model.slide.remove([this.model]);
				}
			},

			/**
			 * Remove component view.
			 *
			 * @param {boolean} disposeModel Whether or not to dispose component's model as well.
			 */
			remove: function(disposeModel) {
				var $doc, deltaDrag, idx, _ref;
				Backbone.View.prototype.remove.call(this);
				_ref = this._deltaDrags;
				for (idx in _ref) {
					deltaDrag = _ref[idx];
					deltaDrag.dispose();
				}
				if (disposeModel) {
					this.model.dispose();
				}

				this.model.off(null, null, this);
				this._toDispose.forEach(function(d) {
					d();
				});
			},

			/**
			 * Event: mouse button has peen pressed down.
			 *
			 * @param {Event} e
			 */
			mousedown: function(e) {
				// When component is dragged, we shouldn't start selecting anything.
				this.$el.parents('.ui-selectable').selectable("disable");

				if (e.which === 1) {
					e.preventDefault();
					this._selectComponent(e);
					this.$el.css("zIndex", zTracker.next());

					// TODO: convert code that depends on
					// this.model.slide into a method call
					// so we can get rid of the if (this.model.slide) everywhere
					if (this.model.slide) {
						this.model.slide.selected.forEach(function(component) {
							component.trigger('dragStart', e);
						});
					} else {
						this.options.deck.selected.forEach(function(component) {
							component.trigger('dragStart', e);
						});
					}
				}
			},

			/**
			 * Select or unselect component on mouse down.
			 *
			 * @param {jQuery.Event} e
			 * @private
			 */
			_selectComponent: function(e) {
				if ((key.pressed.ctrl || key.pressed.meta || key.pressed.shift) && this.model.get("selected")) {
					this.model.set("selected", false);
				}
				else {
					this.model.set("selected", true);
				}
			},

			/**
			 * Event: element is selected by user.
			 *
			 * @param {jQuery.Event} e
			 * @private
			 */
			_selected: function(e) {
				this.model.set("selected", true, { multiselect: true });
			},

			/**
			 * Event: element is unselected by user.
			 *
			 * @param {jQuery.Event} e
			 * @private
			 */
			_unselected: function(e) {
				this.model.set("selected", false);
			},

			/**
			 * React on component is being selected. Toggle a selection class on the element.
			 *
			 * @param {Component} model
			 * @param {boolean} selected
			 * @private
			 */
			_selectionChanged: function(model, selected) {
				if (selected) {
					this.$el.addClass("ui-selected");
				} else {
					this.$el.removeClass("ui-selected");
				}
			},

			/**
			 * Event: mouse is being moved over the element.
			 *
			 * @param {Event} e
			 */
			mousemove: function(e) {
				if (this.model.slide) {
					this.model.slide.selected.forEach(function(component) {
						component.trigger('drag', e);
					});
				} else {
					this.options.deck.selected.forEach(function(component) {
						component.trigger('drag', e);
					});
				}
			},

			/**
			 * Event: mouse button has been released.
			 *
			 * @param {Event} e
			 */
			mouseup: function(e) {
				// Drag is over, selectable can be turned on again.
				this.$el.parents('.ui-selectable').selectable("enable");

				var _this = this;
				if (this.model.slide) {
					undoHistory.record(function(){
						_this.model.slide.selected.forEach(function(component) {
							component.trigger('dragStop', e);
						});
					}, 'Move Components');
				} else {
					undoHistory.record(function(){
						_this.options.deck.selected.forEach(function(component) {
							component.trigger('dragStop', e);
						});
					}, 'Move Slide Transition');
				}
			},

			/**
			 * Event: drag has been started.
			 *
			 * @param {Event} e
			 */
			dragStart: function(e) {
				this.dragScale = this.$el.parent().css(window.browserPrefix + "transform");
				this.dragScale = parseFloat(this.dragScale.substring(7, this.dragScale.indexOf(","))) || 1;
				this._dragging = true;
				this.$el.addClass("dragged");
				this._prevPos = {
					x: this.model.get("x"),
					y: this.model.get("y")
				};
				this._prevMousePos = {
					x: e.pageX,
					y: e.pageY
				};
			},

			/**
			 * Event: drag is in progress.
			 *
			 * @param {Event} e
			 */
			drag: function(e) {
				var dx, dy, gridSize, newX, newY, snapToGrid;
				if (this._dragging && this.allowDragging) {
					snapToGrid = key.pressed.shift;
					dx = e.pageX - this._prevMousePos.x;
					dy = e.pageY - this._prevMousePos.y;
					newX = this._prevPos.x + dx / this.dragScale;
					newY = this._prevPos.y + dy / this.dragScale;
					if (snapToGrid) {
						gridSize = 20;
						newX = Math.floor(newX / gridSize) * gridSize;
						newY = Math.floor(newY / gridSize) * gridSize;
					}
					this.model.setInt("x", newX);
					if (-20 < newX && newX < 0) {
						var exclude = this.$el[0];
						var above, aboveTop;
						this.$el.parent().children('.component').each(function(){
							if (this != exclude) {
								var position = $(this).position().top;
								if (position < newY && (!above || aboveTop <= position)) {
									above = this;
									aboveTop = position;
								}
							}
						});
						if (above) {
							this.$el.insertAfter(above);
						} else {
							this.$el.insertBefore(this.$el.parent().children('.component').first());
						}
						if ("static" != this.model.get("position")) {
							this.model.set("position", "static");
							this.$el.css("position", "static");
							this.$el.find("div").css("display", "block");
						}
					} else if ("static" == this.model.get("position")) {
						this.model.set("position", "absolute");
						this.$el.css("position", "absolute");
						this.$el.find("div").css("display", null);
					}
					this.model.setInt("y", newY);
					if (!this.dragStartLoc) {
						this.dragStartLoc = {
							x: newX,
							y: newY
						};
					}
				}
			},

			/**
			 * Event: drag has been stopped.
			 *
			 * @param {Event} e
			 */
			dragStop: function(e) {
				if (this._dragging) {
					var newX = this.$el.position().left / this.dragScale;
					var newY = this.$el.position().top / this.dragScale;
					if (newX) {
						this.model.setInt("x", newX);
					}
					if (newY) {
						this.model.setInt("y", newY);
					}
					this.model.slide.get("components").sort(function(a, b) {
						return a.get("y") - b.get("y");
					});
					this._dragging = false;
					this.$el.removeClass("dragged");
					if ((this.dragStartLoc != null) && this.dragStartLoc.x !== this.model.get("x") && this.dragStartLoc.y !== this.model.get("y")) {
						undoHistory.pushdo(new ComponentCommands.Move(this.dragStartLoc, this.model));
					}
					this.dragStartLoc = null;
				}
			},

			/**
			 * React on X position change.
			 *
			 * @param {Component} model
			 * @param {number} value
			 * @private
			 */
			_xChanged: function(model, value) {
				this.$el.css("left", value);
				this.$xInput.val(value);
			},

			/**
			 * React on Y position change.
			 *
			 * @param {Component} model
			 * @param {number} value
			 * @private
			 */
			_yChanged: function(model, value) {
				this.$el.css("top", value);
				this.$yInput.val(value);
			},

			/**
			 * Event: Element is being moved horizontally.
			 *
			 * @param {Event} e
			 */
			manualMoveX: function(e) {
				return this.model.setInt("x", e.target.value);
			},

			/**
			 * Event: Element is being moved vertically.
			 *
			 * @param {Event} e
			 */
			manualMoveY: function(e) {
				return this.model.setInt("y", e.target.value);
			},

			/**
			 * Event: Element is being centered.
			 *
			 * @param {Event} e
			 */
			center: function(e) {
				var axis = e.target.getAttribute("data-option");
				getAxis = function(axis, e) {
					return axis == 'x' ? e.width() : e.height()
				};
				var slideSize = getAxis(axis, this.$el.parent('.slideContainer'));
				var textSize = getAxis(axis, this.$el);

				var origPos = {
					x: this.model.get('x'),
					y: this.model.get('y')
				};

				this.model.setInt(axis, ( (slideSize / 2) - (textSize / 2) ));
				var cmd = new ComponentCommands.Move(origPos, this.model);
				undoHistory.push(cmd);
			},

			/**
			 * Event: SkewX transformation started.
			 */
			skewXStart: function() {
				return this._initialSkewX = this.model.get("skewX") || 0;
			},

			/**
			 * Event: SkewX transformation is in progress.
			 *
			 * @param {Event} e
			 * @param {{dx: number, dy: number}} deltas
			 */
			skewX: function(e, deltas) {
				this.model.setFloat("skewX", this._initialSkewX + Math.atan2(deltas.dx, 22));
			},

			/**
			 * Event: SkewX transformation stopped.
			 */
			skewXStop: function() {
				var cmd = new ComponentCommands.SkewX(this._initialSkewX, this.model);
				undoHistory.push(cmd);
			},

			/**
			 * Event: SkewY transformation started.
			 */
			skewYStart: function() {
				return this._initialSkewY = this.model.get("skewY") || 0;
			},

			/**
			 * Event: SkewY transformation is in progress.
			 *
			 * @param {Event} e
			 * @param {{dx: number, dy: number}} deltas
			 */
			skewY: function(e, deltas) {
				this.model.setFloat("skewY", this._initialSkewY + Math.atan2(deltas.dy, 22));
			},

			/**
			 * Event: SkewY transformation stopped.
			 */
			skewYStop: function() {
				var cmd = new ComponentCommands.SkewY(this._initialSkewY, this.model);
				undoHistory.push(cmd);
			},


			/**
			 * Event: rotation started.
			 *
			 * @param {Event} e
			 * @param {{x: number, y: number}} deltas
			 */
			rotateStart: function(e, deltas) {
				this.updateOrigin();
				this._rotOffset = this._calcRot(deltas);
				this._initialRotate = this.model.get("rotate") || 0;
			},

			/**
			 * Save initial location of the element.
			 */
			updateOrigin: function() {
				var offset;
				offset = this.$el.offset();
				this._origin = {
					x: this.$el.width() / 2 + offset.left,
					y: this.$el.height() / 2 + offset.top
				};
			},

			/**
			 * Calculate rotation offset.
			 *
			 * @param {{x: number, y: number}} point
			 * @returns {number}
			 * @private
			 */
			_calcRot: function(point) {
				return Math.atan2(point.y - this._origin.y, point.x - this._origin.x);
			},

			/**
			 * Event: rotation is in progress.
			 *
			 * @param {Event} e
			 * @param {{x: number, y: number}} deltas
			 */
			rotate: function(e, deltas) {
				var newRot, rot;
				rot = this._calcRot(deltas);
				newRot = this._initialRotate + rot - this._rotOffset;
				if (key.pressed.shift) {
					newRot = Math.floor(newRot / Math.PI * 8) / 8 * Math.PI;
				}
				newRot = newRot % (2 * Math.PI);
				this.model.setFloat("rotate", newRot);
			},

			/**
			 * Event: rotation stopped.
			 */
			rotateStop: function() {
				var cmd = new ComponentCommands.Rotate(this._initialRotate, this.model);
				undoHistory.push(cmd);
			},

			// TODO fix or remove commented code and unused variables
			/**
			 * Event: scale started.
			 *
			 * @param {Event} e
			 */
			scaleStart: function(e) {
				var H, elHeight, elOffset, elWidth, theta;
				this.dragScale = this.$el.parent().css(window.browserPrefix + "transform");
				this.dragScale = parseFloat(this.dragScale.substring(7, this.dragScale.indexOf(","))) || 1;
				this._initialScale = this.model.get("scale");
				elOffset = this.$el.offset();
				elWidth = this.$el.width() * this._initialScale.x;
				elHeight = this.$el.height() * this._initialScale.y;

				theta = this.model.get("rotate") || 0;
				// theta = (theta + Math.atan2(elHeight / 2, elWidth / 2)) % (2 * Math.PI);

				if (!(this.origSize != null)) {
					this.origSize = {
						width: this.$el.width(),
						height: this.$el.height()
					};
				}

				this._scaleDim = {
					width: this._initialScale.x * this.origSize.width,
					height: this._initialScale.y * this.origSize.height,
					theta: theta
				};
			},

			// TODO fix or remove commented code
			/**
			 * Event: scale in progress.
			 *
			 * @param {Event} e
			 * @param {{dx: number, dy: number}} deltas
			 */
			scale: function(e, deltas) {
				var dx, dy, fixRatioDisabled, scale;
				fixRatioDisabled = key.pressed.shift;

				var xSignum = 1;
				var ySignum = 1;
				// if (this._scaleDim.theta < -Math.PI / 2 && this._scaleDim.theta > -3/2 * Math.PI) {
				//   xSignum = -1;
				//   ySignum = -1;
				// } if (this._scaleDim.theta > Math.PI/2) {
				//   xSignum = -1;
				// }

				var scaleX = (xSignum * deltas.dx + this._scaleDim.width) / (this._scaleDim.width);
				var scaleY = (ySignum * deltas.dy + this._scaleDim.height) / (this._scaleDim.height);


				scale = {
					x: this._initialScale.x * scaleX,
					y: this._initialScale.y * (fixRatioDisabled ? scaleY : scaleX)
				};

				scale.width = scale.x * this.origSize.width;
				scale.height = scale.y * this.origSize.height;
				this.model.set("scale", scale);
			},

			/**
			 * Event: scale stopped.
			 */
			scaleStop: function() {
				var cmd = new ComponentCommands.Scale(this._initialScale, this.model);
				undoHistory.push(cmd);
			},

			/**
			 * Render element based on component model.
			 *
			 * @returns {*}
			 */
			render: function() {
				var size,
					_this = this;
				this.$el.html(this.__getTemplate()(this.model.attributes));
				this.$el.find("span[data-delta]").each(function(idx, elem) {
					var deltaDrag;
					deltaDrag = new DeltaDragControl($(elem), true);
					return _this._deltaDrags.push(deltaDrag);
				});
				this.$content = this.$el.find(".content");
				this.$content.addClass(this.model.customClasses());
				this.$contentScale = this.$el.find(".content-scale");
				this._selectionChanged(this.model, this.model.get("selected"));
				this.$xInput = this.$el.find("[data-option='x']");
				this.$yInput = this.$el.find("[data-option='y']");
				if ("static" == this.model.get("position")) {
					this.$el.css("position", "static");
					this.$el.find("div").css("display", "block");
				} else {
					this.$el.css({
						top: this.model.get("y"),
						left: this.model.get("x")
					});
				}
				size = {
					width: this.$el.width(),
					height: this.$el.height()
				};
				if (size.width > 0 && size.height > 0) {
					this.origSize = size;
				}
				this._setUpdatedTransform();
				return this.$el;
			},

			/**
			 * Update element css transform rules.
			 *
			 * @private
			 */
			_setUpdatedTransform: function() {
				var newHeight, newWidth, obj, scale, transformStr;
				transformStr = this._buildTransformString();
				obj = {
					transform: transformStr
				};
				obj[window.browserPrefix + "transform"] = transformStr;
				this.$content.css(obj);
				scale = this.model.get("scale");
				if (this.origSize != null) {
					newWidth = scale.width || this.origSize.width;
					newHeight = scale.height || this.origSize.height;
					this.$el.css({
						width: newWidth,
						height: newHeight
					});
				}
				if (scale != null) {
					this.$contentScale.css(window.browserPrefix + "transform", "scale(" + scale.x + "," + scale.y + ")");
				}
				this.$el.css(window.browserPrefix + "transform", "rotate(" + this.model.get("rotate") + "rad)");
			},

			/**
			 * Build css transformation string based on component transformations (scale, rotate, etc.)
			 *
			 * @returns {string}
			 * @private
			 */
			_buildTransformString: function() {
				var transformStr = "";
				this.transforms.forEach(function(transformName) {
					var transformValue;
					transformValue = this.model.get(transformName);
					if (transformValue) {
						return transformStr += transformName + "(" + transformValue + "rad) ";
					}
				}, this);
				return transformStr;
			},

			/**
			 * Update element's custom classes.
			 *
			 * @param {Component} model
			 * @param {string} classes
			 * @private
			 */
			_updateCustomClasses: function(model, classes) {
				this.$content.attr('class', 'content ' + classes);
			},

			/**
			 * Get view template.
			 *
			 * @returns {*}
			 * @private
			 */
			__getTemplate: function() {
				return JST["strut.slide_components/Component"];
			},

			/**
			 * React on component is being unrendered.
			 *
			 * @returns {*}
			 * @private
			 */
			_unrender: function() {
				return this.remove(false);
			},

			constructor: function ComponentView() {
				Backbone.View.prototype.constructor.apply(this, arguments);
			}
		});
	});
