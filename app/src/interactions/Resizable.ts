'use strict';

var ops = {
	n: function(e) {
		var resizable = this._resizable;
		resizable.top = resizable.otop + e.dy;
		resizable.height = resizable.oheight - e.dy;
	},

	s: function(e) {
		var resizable = this._resizable;
		resizable.height = resizable.oheight + e.dy;
	},

	w: function(e) {
		var resizable = this._resizable;
		resizable.left = resizable.oleft + e.dx;
		resizable.width = resizable.owidth - e.dx;
	},

	e: function(e) {
		var resizable = this._resizable;
		resizable.width = resizable.owidth + e.dx;
	},

	nw: function(e) {
		var resizable = this._resizable;
		resizable.top = resizable.otop + e.dy;
		resizable.height = resizable.oheight - e.dy;
		resizable.left = resizable.oleft + e.dx;
		resizable.width = resizable.owidth - e.dx;
	},

	ne: function(e) {
		var resizable = this._resizable;
		resizable.top = resizable.otop + e.dy;
		resizable.width = resizable.owidth + e.dx;
		resizable.height = resizable.oheight - e.dy;
	},

	sw: function(e) {
		var resizable = this._resizable;
		resizable.width = resizable.owidth - e.dx;
		resizable.left = resizable.oleft + e.dx;
		resizable.height = resizable.oheight + e.dy;
	},

	se: function(e) {
		var resizable = this._resizable;
		resizable.width = resizable.owidth + e.dx;
		resizable.height = resizable.oheight + e.dy;
	}
};

export default {
	componentWillMount() {
		this._resizable = {};
	},

	onDeltaDragStart: function() {
		var computedStyle = window.getComputedStyle(this.getDOMNode());
		var resizable = this._resizable;
		resizable.otop = parseInt(computedStyle.top) || 0;
		resizable.oleft = parseInt(computedStyle.left) || 0;
		resizable.owidth = parseInt(computedStyle.width) || 0;
		resizable.oheight = parseInt(computedStyle.height) || 0;
	},

	onDeltaDrag: function(d, e) {
		ops[d].call(this, e);
		if (this.onResize) {
			var resizable = this._resizable;
			this.onResize({
				top: resizable.top,
				left: resizable.left,
				height: resizable.height,
				width: resizable.width,
			});
		}
	}
};
