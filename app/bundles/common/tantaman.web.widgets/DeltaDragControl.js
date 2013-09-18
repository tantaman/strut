define(['tantaman/web/interactions/TouchBridge'], function(TouchBridge) {
		var DragControl, events;
		events = ["mousedown", "mousemove", "mouseup"];
		return DragControl = (function() {

			function DragControl($el, stopProp) {
				this.$el = $el;
				this.stopProp = stopProp;
				this.dragging = false;
				this._mousemove = this.mousemove.bind(this);
				this._mouseup = this.mouseup.bind(this);
				this._mouseout = this._mouseup;

				this._toDispose = [];
				
				this._toDispose.push(TouchBridge.on.mousemove($(document), this._mousemove));
				this._toDispose.push(TouchBridge.on.mouseup($(document), this._mouseup));
				TouchBridge.on.mousedown(this.$el, this.mousedown.bind(this));
				TouchBridge.on.mouseup(this.$el, this._mouseup);
			}

			DragControl.prototype.dispose = function() {
				this._toDispose.forEach(function(d) {
					d();
				});
			};

			DragControl.prototype.mousedown = function(e) {
				e.preventDefault();
				this.dragging = true;
				this._startPos = {
					x: e.pageX,
					y: e.pageY
				};
				this.$el.trigger("deltadragStart", {
					x: e.pageX,
					y: e.pageY
				});
				if (this.stopProp) {
					return e.stopPropagation();
				}
			};

			DragControl.prototype.mousemove = function(e) {
				var dx, dy;
				if (this.dragging) {
					dx = e.pageX - this._startPos.x;
					dy = e.pageY - this._startPos.y;
					this.$el.trigger("deltadrag", [
						{
							dx: dx,
							dy: dy,
							x: e.pageX,
							y: e.pageY
						}
					]);
					if (this.stopProp) {
						return e.stopPropagation();
					}
				}
			};

			DragControl.prototype.mouseup = function(e) {
				if (this.dragging) {
					this.dragging = false;
					this.$el.trigger("deltadragStop");
				}
				return true;
			};

			return DragControl;

		})();
	});