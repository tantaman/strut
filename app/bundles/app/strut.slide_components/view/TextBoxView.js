define(["./ComponentView", "libs/etch",
	"strut/deck/ComponentCommands",
	"tantaman/web/undo_support/CmdListFactory",
	"tantaman/web/interactions/TouchBridge"],
	function(ComponentView, etch, ComponentCommands, CmdListFactory, TouchBridge) {
		'use strict';
		var undoHistory = CmdListFactory.managedInstance('editor');
		var styles;
		styles = ["family", "size", "weight", "style", "color", "decoration", "align"];

		/**
		 * @class TextBoxView
		 * @augments ComponentView
		 */
		return ComponentView.extend({
			className: "component textBox",
			tagName: "div",

			/**
			 * Returns list of events, tracked by this view.
			 *
			 * @returns {Object}
			 */
			events: function() {
				var myEvents, parentEvents;
				parentEvents = ComponentView.prototype.events();
				myEvents = {
					"editComplete": "editCompleted",
					"mouseup": "mouseup"
				};
				return _.extend(parentEvents, myEvents);
			},

			/**
			 * Initialize TextBox component view.
			 */
			initialize: function() {
				var style, _i, _len;
				ComponentView.prototype.initialize.apply(this, arguments);
				for (_i = 0, _len = styles.length; _i < _len; _i++) {
					style = styles[_i];
					this.model.on("change:" + style, this._styleChanged, this);
				}
				this.model.on("change:text", this._textChanged, this);
				this._lastDx = 0;
				this.keydown = this.keydown.bind(this);

				this.dblclicked = this.dblclicked.bind(this);
				TouchBridge.on.dblclick(this.$el, this.dblclicked);

				// TODO This can be uncommented once modal windows start blocking all slide key events.
				// https://github.com/tantaman/Strut/pull/183
				// $(document).bind("keydown", this.keydown);

				this.model.on("edit", this.edit, this);
			},

			/**
			 * Event: scale started.
			 */
			scaleStart: function() {
				this._initialSize = this.model.get('size');
			},

			/**
			 * Event: scale in progress.
			 *
			 * @param {Event} e
			 * @param {{dx: number, dy: number}} deltas
			 */
			scale: function(e, deltas) {
				var currSize, sign;
				currSize = this.model.get("size");
				sign = deltas.dx - this._lastDx > 0 ? 1 : -1;
				this.model.set("size", currSize + Math.round(sign * Math.sqrt(Math.abs(deltas.dx - this._lastDx))));
				return this._lastDx = deltas.dx;
			},

			/**
			 * Event: scale stopped.
			 */
			scaleStop: function() {
				var cmd = ComponentCommands.TextScale(this._initialSize, this.model);
				undoHistory.push(cmd);
			},

			/**
			 * Remove component view.
			 *
			 * @param {boolean} disposeModel Whether or not to dispose component's model as well.
			 */
			remove: function(disposeModel) {
				ComponentView.prototype.remove.apply(this, arguments);
				// TODO This can be uncommented once modal windows start blocking all slide key events.
				// $(document).unbind("keydown", this.keydown);
			},

			/**
			 * Event: element is double clicked. Enter editing mode for a textbox.
			 *
			 * @param {Event} e
			 */
			dblclicked: function(e) {
				this.$el.addClass("editable");
				this.$textEl.attr("contenteditable", true);
				if (e != null) {
					this._initialText = this.$textEl.html();
					etch.editableInit.call(this, e, this.model.get("y") * this.dragScale + 35);

					// Focus editor and select all text.
					if (!this.editing) {
						this.$textEl.get(0).focus();
						try {
							document.execCommand('selectAll', false, null);
							etch.triggerCaret();
						} catch (e) {
							// firefox failboats on this command
							// for some reason.  hence the try/catch
							// console.log(e);
						}
					}
				}
				this.allowDragging = false;
				this.editing = true;
			},

			/**
			 * Event: mouse button has peen pressed down, drag started. If in editing mode, move etch to the clicked spot.
			 *
			 * @param {Event} e
			 */
			mousedown: function(e) {
				if (this.editing) {
					e.stopPropagation();
					etch.editableInit.call(this, e, this.model.get("y") * this.dragScale + 35);
				} else {
					ComponentView.prototype.mousedown.apply(this, arguments);
				}
				return true;
			},

			// TODO Add doc (Why do we need to call trigger caret?)
			/**
			 * Event: mouse button has been released.
			 *
			 * @param {Event} e
			 */
			mouseup: function(e) {
				if (this.editing) {
					etch.triggerCaret();
					//etch.editableInit.call(this, e, this.model.get("y") * this.dragScale + 35);
				}
				ComponentView.prototype.mouseup.apply(this, arguments);
			},

			/**
			 * Event: key has been pressed down. If textbox is in focus, and it was a charachter key pressed, then start
			 * typing in the textbox.
			 *
			 * @param {Event} e
			 */
			keydown: function(e) {
				// When user starts typing text in selected textbox, open edit mode immediately.
				if (this.model.get("selected") && !this.editing) {
					if (!e.ctrlKey && !e.altKey && !e.metaKey && String.fromCharCode(e.which).match(/[\w]/)) {
						this.edit();
					}
				}
			},

			/**
			 * Open editor for the textbox.
			 */
			edit: function() {
				var e;
				this.model.set("selected", true);
				e = $.Event("click", {
					pageX: this.model.get("x")
				});
				this.dblclicked(e);
				this.$textEl.selectText();
			},

			/**
			 * Finish editing and close the editor.
			 */
			editCompleted: function() {
				var text;
				text = this.$textEl.html();
				this.editing = false;
				if (text === "") {
					return this.remove();
				} else {
					var cmd = ComponentCommands.Text(this._initialText, this.model);
					undoHistory.push(cmd);

					this.model.set("text", text);
					window.getSelection().removeAllRanges();
					this.$textEl.attr("contenteditable", false);
					this.$el.removeClass("editable");
					this.allowDragging = true;
				}
			},

			/**
			 * React on component is being selected. If component have been unselected, hide it's editor, if in editing mode.
			 *
			 * @param {Component} model
			 * @param {boolean} selected
			 * @private
			 */
			_selectionChanged: function(model, selected) {
				ComponentView.prototype._selectionChanged.apply(this, arguments);
				if (!selected && this.editing) {
					this.editCompleted();
				}
			},

			/**
			 * React on component style change. Update CSS classes of the element.
			 *
			 * @param {Component} model
			 * @param {string} style
			 * @param {Object} opts
			 * @private
			 */
			_styleChanged: function(model, style, opts) {
				var key, value, _ref, _results;
				_ref = opts.changes; //model.changed;
				if (!_ref) return;
				for (var i = 0; i < _ref.length; ++i) {
					key = _ref[i];
					value = model.get(key);
					if (value) {
						if (key === "decoration" || key === "align") {
							key = "text" + key.substring(0, 1).toUpperCase() + key.substr(1);
						} else if (key !== "color") {
							key = "font" + key.substr(0, 1).toUpperCase() + key.substr(1);
						}
						this.$el.css(key, style);
					}
				}
			},

			/**
			 * React on component's text change. Update html contents of the text box.
			 *
			 * @param {Component} model
			 * @param {string} text Updated text (HTML code).
			 * @private
			 */
			_textChanged: function(model, text) {
				this.$textEl.html(text);
			},

			_handlePaste: function(elem, e) {
				e = e.originalEvent;
				document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
				// var sel = window.getSelection();
				// var range = sel.getRangeAt(0);
				// var text = document.createTextNode(e.clipboardData.getData('text/plain'));
				// range.deleteContents();
				// range.insertNode(text);

				// range.setStartAfter(text);
				// range.setEndAfter(text);

				// sel.removeAllRanges();
				// sel.addRange(range);

				e.preventDefault();
			},

			/**
			 * Render element based on component model.
			 *
			 * @returns {*}
			 */
			render: function() {
				ComponentView.prototype.render.call(this);
				this.$textEl = this.$el.find(".content");
				var self = this;
				this.$textEl.bind('paste', function(e) {
					self._handlePaste(this, e);
				});
				this.$textEl.html(this.model.get("text"));
				this.$el.css({
					// fontFamily: this.model.get("family"),
					fontSize: this.model.get("size"),
					// fontWeight: this.model.get("weight"),
					// fontStyle: this.model.get("style"),
					// color: "#" + this.model.get("color"),
					top: this.model.get("y"),
					left: this.model.get("x"),
					// textDecoration: this.model.get("decoration"),
					// textAlign: this.model.get("align")
				});
				return this.$el;
			},

			constructor: function TextBoxView() {
				ComponentView.prototype.constructor.apply(this, arguments);
			}
		});
	});