define(function() {
	'use strict';

	function Sortable(options) {
		this._$container = $(options.container);
		this._$container.css('position', 'relative');

		this._pressed = this._pressed.bind(this);
		this._released = this._released.bind(this);
		this._moved = this._moved.bind(this);

		this._selector = options.selector || '>';
		this._$container.on('mousedown', this._selector, this._pressed);

		this._$document = $(document);
		this._$document.on('mouseup', this._released);
		this._$document.on('mousemove', this._moved);

		this._delta = {
			x: 0,
			y: 0
		};
	}

	Sortable.prototype = {
		_pressed: function(e) {
			this._dragging = true;

			this._origPoint = {
				x: e.pageX,
				y: e.pageY
			};

			this._delta.x = this._delta.y = 0;
			this._$currentTarget = $(e.currentTarget);

			this._startOffset = this._$currentTarget.position();

			this._internalOffset = {
				x: e.pageX - this._startOffset.left,
				y: e.pageY - this._startOffset.top
			};
		},

		_buildIndex: function($items) {
			// TODO: should really find the smallest sortable item and 
			// generate tile size based on that
			var w = this._w = this._$currentTarget.outerWidth() / 2;
			var h = this._h = this._$currentTarget.outerHeight() / 2;

			var index = [];

			$items.each(function() {
				var $item = $(this);

				var offset = $item.position();
				var itemH = $item.outerHeight();
				var itemW = $item.outerWidth;
				var r = ((offset.top) / h) | 0;
				var c = ((offset.left) / w) | 0;

				var row = index[r];
				if (row == null) {
					row = [];
					index[r] = row;
				}
				var prev = row[c];
				if (prev != null) {
					if (Array.isArray(prev))
						prev.push($item);
					else
						row[c] = [prev, $item];
				} else {
					row[c] = $item;
				}
			});

			return index;
		},

		_released: function(e) {
			//TODO: replace placeholder
			this._dragging = false;
			if (!this._$currentTarget) return;
			this._$currentTarget.css({
				position: '',
				top: '',
				left: '',
				'z-index': 0
			});
			this._index = undefined;

			if (this._$placeholder) {
				this._$placeholder.after(this._$currentTarget);
				this._$placeholder.remove();
			}
			this._$currentTarget = undefined;
			this._$lastItem = undefined;
			this._$placeholder = undefined;

			// determine if we can drop it
			// if not, reset it
			// if so, place it into the DOM at the correct position
		},

		_moved: function(e) {
			if (this._dragging) {
				if (this._index == null) {
					this._$children = this._$container.find(this._selector);
					this._index = this._buildIndex(this._$children);
					this._$placeholder = $('<div>').css({
						width: this._$currentTarget.outerWidth(),
						height: this._$currentTarget.outerHeight(),
						margin: 0,
						padding: 0
					});

					this._$currentTarget.css({
						position: 'absolute',
						'z-index': 1
					});
					this._$currentTarget.after(this._$placeholder);
				}
				this._doDrag(e);
			}
		},

		_doDrag: function(e) {
			var dy = e.pageY - this._origPoint.y;
			var dx = e.pageX - this._origPoint.x;

			var offY = this._startOffset.top + dy;
			var offX = this._startOffset.left + dx;

			var r = (offY / this._h) | 0;
			var c = (offX / this._w) | 0;
			// console.log(r);

			var targetY = e.pageY - this._internalOffset.y;
			var targetX = e.pageX - this._internalOffset.x;

			var row = this._index[r];
			var $item = this._getClosest(row && row[c], targetX, targetY);

			if ($item && $item[0] != this._$currentTarget[0]
				&& $item.next()[0] != this._$currentTarget[0]) {
				if ($item != this._$lastItem) {
					$item.after(this._$placeholder);
					this._$lastItem = $item;
					this._lastDirection = 'after';
				} else {
					var itemOffset = $item.position();
					var itemY = itemOffset.top + $item.outerHeight() / 2;
					var itemX = itemOffset.left + $item.outerWidth() / 2;

					if (targetY < itemY
						&& targetX < itemX && this._lastDirection != 'before') {
						$item.before(this._$placeholder);
					} else if (targetY > itemY
						&& targetX > itemX && this._lastDirection != 'after') {
						$item.after(this._$placeholder);
					}
				}
			}

			this._$currentTarget.css({
				top: targetY,
				left: targetX
			});
		},

		_getClosest: function(items, x, y) {
			if (Array.isArray(items)) {
				var minDist = Number.NAX_VALUE;
				var result;
				items.forEach(function($item) {
					var offset = $item.position();
					var dist = Math.sqrt(Math.pow(x - offset.left, 2) + Math.pow(y - offset.top, 2));
					if (dist < minDist) {
						minDist = dist;
						result = $item;
					}
				}, this);
				return result;
			} else
				return items;
		},

		dispose: function(e) {
			this._$document.off('mouseup', this._released);
			this._$document.off('mousemove', this._moved);
		}
	};

	return Sortable;
});