/**
@author Matt Crinklaw-Vogt (tantaman)
*/
(function( $ ) {
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
		this.opts = opts;

		this.$preview = $("<div class='gradientPicker-preview'></div>");
		this.$el.append(this.$preview);

		var $ctrlPtContainer = $("<div class='gradientPicker-ctrlPts'></div>");
		this.$el.append($ctrlPtContainer)

		this.updatePreview = bind(this.updatePreview, this);
		this.controlPoints = [];
		for (var i = 0; i < opts.controlPoints.length; ++i) {
			var ctrlPt = new ControlPoint($ctrlPtContainer, opts.controlPoints[i], opts.orientation, this.updatePreview);
			this.controlPoints.push(ctrlPt);
		}

		this.updatePreview();
	}

	GradientSelection.prototype = {
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

	function ControlPoint($parentEl, initialState, orientation, cb) {
		this.$el = $("<div class='gradientPicker-ctrlPt'></div>");
		$parentEl.append(this.$el);
		this.$parentEl = $parentEl;

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
		this.$el.draggable({
			axis: (orientation == "horizontal") ? "x" : "y",
			drag: this.drag,
			stop: this.stop,
			containment: $parentEl
		});
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
		}
	};

	function ControlPtConfig() {

	}

	ControlPtConfig.prototype = {

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