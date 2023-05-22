"use strict";

type Delta = {
  dx: number;
  dy: number;
};

const ops = {
  n: function (this: Resizable, e: Delta) {
    var resizable = this._resizable;
    resizable.top = resizable.otop || 0 + e.dy;
    resizable.height = resizable.oheight || 0 - e.dy;
  },

  s: function (this: Resizable, e: Delta) {
    var resizable = this._resizable;
    resizable.height = resizable.oheight || 0 + e.dy;
  },

  w: function (this: Resizable, e: Delta) {
    var resizable = this._resizable;
    resizable.left = resizable.oleft || 0 + e.dx;
    resizable.width = resizable.owidth || 0 - e.dx;
  },

  e: function (this: Resizable, e: Delta) {
    var resizable = this._resizable;
    resizable.width = resizable.owidth || 0 + e.dx;
  },

  nw: function (this: Resizable, e: Delta) {
    var resizable = this._resizable;
    resizable.top = resizable.otop || 0 + e.dy;
    resizable.height = resizable.oheight || 0 - e.dy;
    resizable.left = resizable.oleft || 0 + e.dx;
    resizable.width = resizable.owidth || 0 - e.dx;
  },

  ne: function (this: Resizable, e: Delta) {
    var resizable = this._resizable;
    resizable.top = resizable.otop || 0 + e.dy;
    resizable.width = resizable.owidth || 0 + e.dx;
    resizable.height = resizable.oheight || 0 - e.dy;
  },

  sw: function (this: Resizable, e: Delta) {
    var resizable = this._resizable;
    resizable.width = resizable.owidth || 0 - e.dx;
    resizable.left = resizable.oleft || 0 + e.dx;
    resizable.height = resizable.oheight || 0 + e.dy;
  },

  se: function (this: Resizable, e: Delta) {
    var resizable = this._resizable;
    resizable.width = resizable.owidth || 0 + e.dx;
    resizable.height = resizable.oheight || 0 + e.dy;
  },
} as const;

interface Resizable {
  _resizable: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;

    owidth?: number;
    oheight?: number;
    oleft?: number;
    otop?: number;
  };

  onResize?: (x: {
    top: number;
    left: number;
    width: number;
    height: number;
  }) => void;

  getDOMNode(): Element;
}

export default {
  componentWillMount(this: Resizable) {
    this._resizable = {};
  },

  onDeltaDragStart: function (this: Resizable) {
    var computedStyle = window.getComputedStyle(this.getDOMNode());
    var resizable = this._resizable;
    resizable.otop = parseInt(computedStyle.top) || 0;
    resizable.oleft = parseInt(computedStyle.left) || 0;
    resizable.owidth = parseInt(computedStyle.width) || 0;
    resizable.oheight = parseInt(computedStyle.height) || 0;
  },

  onDeltaDrag: function (this: Resizable, d: keyof typeof ops, e: Delta) {
    ops[d].call(this, e);
    if (this.onResize) {
      var resizable = this._resizable;
      this.onResize({
        top: resizable.top || 0,
        left: resizable.left || 0,
        height: resizable.height || 0,
        width: resizable.width || 0,
      });
    }
  },
};
