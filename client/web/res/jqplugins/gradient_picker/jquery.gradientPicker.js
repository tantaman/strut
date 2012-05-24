/**
@author Matt Crinklaw-Vogt (tantaman)
*/
(function( $ ) {
	if (!$.event.special.destroyed) {
		$.event.special.destroyed = {
		    remove: function(o) {
		    	if (o.handler) {
		    		o.handler();
		    	}
		    }
		}
	}


	function bind(fn, ctx) {
		if (typeof fn.bind === "function") {
			return fn.bind(ctx);
		} else {
			return function() {
				fn.apply(ctx, arguments);
			}
		}
	}

	var browserPrefix = "";
	if ($.browser.mozilla) {
		browserPrefix = "-moz-";
	} else if ($.browser.webkit) {
		browserPrefix = "-webkit-";
	} else if ($.browser.opera) {
		browserPrefix = "-o-";
	} else if ($.browser.msie) {
		browserPrefix = "-ms-";
	}

	function GradientSelection(elem, opts) {
		this.$el = $(elem);
		this.$el.css("position", "relative");
		this.opts = opts;

		this.$preview = $("<div class='gradientPicker-preview'></div>");
		this.$el.append(this.$preview);

		var $ctrlPtContainer = $("<div class='gradientPicker-ctrlPts'></div>");
		this.$el.append($ctrlPtContainer)

		this.updatePreview = bind(this.updatePreview, this);
		this.controlPoints = [];
		this.ctrlPtConfig = new ControlPtConfig(this.$el, opts);
		for (var i = 0; i < opts.controlPoints.length; ++i) {
			var ctrlPt = new ControlPoint($ctrlPtContainer, opts.controlPoints[i], opts.orientation, this.updatePreview, this.ctrlPtConfig);
			this.controlPoints.push(ctrlPt);
		}

		this.docClicked = bind(this.docClicked, this);
		this.destroyed = bind(this.destroyed, this);
		$(document).bind("click", this.docClicked);
		this.$el.bind("destroyed", this.destroyed);
		this.previewClicked = bind(this.previewClicked, this);

		this.updatePreview();
	}

	GradientSelection.prototype = {
		docClicked: function() {
			this.ctrlPtConfig.hide();
		},

		destroyed: function() {
			console.log("UNBINDING!");
			$(document).unbind("click", this.docClicked);
		},

		updatePreview: function() {
			// Cycle through control points and generate the correct styles to apply
			//this.$el.css("background", "black");
			var styles = this._generatePreviewStyles();
			if (styles[1]) {
				this.$preview.css("background-image", styles[1]);
			} else {
				this.$preview.css("background-image", styles[0]);
			}

			this.opts.change(styles);
		},

		previewClicked: function() {

		},

		_generatePreviewStyles: function() {
			//linear-gradient(top, rgb(217,230,163) 86%, rgb(227,249,159) 9%)
			var str = "linear-gradient(" + this.opts.fillDirection;
			for (var i = 0; i < this.controlPoints.length; ++i) {
				var pt = this.controlPoints[i];
				str += ", " + pt.color + " " + pt.position + "%";
			}

			str = str + ")"
			var styles = [str, browserPrefix + str];
			return styles;
		}
	};

	function ControlPoint($parentEl, initialState, orientation, cb, ctrlPtConfig) {
		this.$el = $("<div class='gradientPicker-ctrlPt'></div>");
		$parentEl.append(this.$el);
		this.$parentEl = $parentEl;
		this.configView = ctrlPtConfig;

		initialState = initialState.split(" ");
		this.position = parseInt(initialState[1]);
		this.color = initialState[0];
		this.cb = cb;
		this.outerWidth = this.$el.outerWidth();

		this.$el.css("background-color", this.color);
		if (orientation == "horizontal") {
			var pxLeft = ($parentEl.width() - this.$el.outerWidth()) * (parseInt(this.position) / 100);
			this.$el.css("left", pxLeft);
		} else {
			var pxTop = ($parentEl.height() - this.$el.outerHeight()) * (parseInt(this.position) / 100);
			this.$el.css("top", pxTop);
		}
		
		this.drag = bind(this.drag, this);
		this.stop = bind(this.stop, this);
		this.clicked = bind(this.clicked, this);
		this.colorChanged = bind(this.colorChanged, this);
		this.$el.draggable({
			axis: (orientation == "horizontal") ? "x" : "y",
			drag: this.drag,
			stop: this.stop,
			containment: $parentEl
		});
		this.$el.click(this.clicked);
	}

	ControlPoint.prototype = {
		drag: function(e, ui) {
			// convert position to a %
			var left = ui.position.left;
			this.position = (left / (this.$parentEl.width() - this.outerWidth))*100 | 0;
			this.cb();
		},
		stop: function(e, ui) {
			this.cb();
			this.configView.show(this.$el.position(), this.color, this.colorChanged);
		},

		clicked: function(e) {
			this.configView.show(this.$el.position(), this.color, this.colorChanged);
			e.stopPropagation();
			return false;
		},

		colorChanged: function(c) {
			this.color = c;
			this.$el.css("background-color", this.color);
			this.cb();
		}
	};

	function ControlPtConfig($parent, opts) {
		//color-chooser
		this.$el = $('<div class="gradientPicker-ptConfig" style="visibility: hidden"></div>');
		$parent.append(this.$el);
		var $cpicker = $('<div class="color-chooser"></div>');
		this.$el.append($cpicker);

		this.colorChanged = bind(this.colorChanged, this);
		$cpicker.ColorPicker({
			onChange: this.colorChanged
		});
		this.$cpicker = $cpicker;
		this.opts = opts;
		this.visible = false;
	}

	ControlPtConfig.prototype = {
		show: function(position, color, cb) {
			if (!this.visible) {
				this.visible = true;
				this.cb = cb;
				this.$el.css("visibility", "visible");
				this.$cpicker.ColorPickerSetColor(color);
				this.$cpicker.css("background-color", color);
			}
			if (this.opts.orientation === "horizontal") {
				this.$el.css("left", position.left);
			} else {
				this.$el.css("top", position.top);
			}
			//else {
			//	this.visible = false;
				//this.$el.css("visibility", "hidden");
			//}
		},

		hide: function() {
			if (this.visible) {
				this.$el.css("visibility", "hidden");
				this.visible = false;
			}
		},

		colorChanged: function(hsb, hex, rgb) {
			hex = "#" + hex;
			this.cb(hex);
			this.$cpicker.css("background-color", hex)
		}
	};

	$.fn.gradientPicker = function(opts) {
		opts = $.extend({
			controlPoints: ["#FFF 0%", "#000 100%"],
			orientation: "horizontal",
			type: "linear",
			fillDirection: "left",
			change: function() {}
		}, opts);

		this.each(function() {
			new GradientSelection(this, opts);
		});
	};
})( jQuery );