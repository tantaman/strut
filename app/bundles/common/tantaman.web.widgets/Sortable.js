define(function() {
	'use strict';

	function Sortable(options) {
		this._$container = $(options.container);

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
		this._firstPoint = {
			x: 0,
			y: 0
		};
	}

	Sortable.prototype = {
		_pressed: function(e) {
			this._dragging = true;

			this._firstPoint.x = e.pageX;
			this._firstPoint.y = e.pageY;

			this._origPoint = {
				x: this._firstPoint.x,
				y: this._firstPoint.y
			};

			this._delta.x = this._delta.y = 0;
			this._$currentTarget = $(e.currentTarget);

			this._startOffset = this._$currentTarget.offset();

			this._internalOffset = {
				x: this._firstPoint.x - this._startOffset.left,
				y: this._firstPoint.y - this._startOffset.top
			};

			this._lastPoint = {
				x: this._firstPoint.x,
				y: this._firstPoint.y
			};

			this._$currentTarget.css({
				position: 'relative',
				'z-index': 1
			});
		},

		_buildIndex: function($items) {
			var w = this._w = this._$currentTarget.outerWidth();
			var h = this._h = this._$currentTarget.outerHeight();

			var index = [];

			$items.each(function() {
				var $item = $(this);

				var offset = $item.offset();
				var r = (offset.top / h) | 0;
				var c = (offset.left / w) | 0;

				var row = index[r];
				if (row == null) {
					row = [];
					index[r] = row;
				}
				row[c] = $item;
			});

			return index;
		},

		_released: function(e) {
			this._dragging = false;
			this._$currentTarget.css({
				position: '',
				top: '',
				left: '',
				'z-index': 0
			});
			this._index = undefined;
			this._$currentTarget = undefined;
			this._$lastItem = undefined;

			// determine if we can drop it
			// if not, reset it
			// if so, place it into the DOM at the correct position
		},

		_moved: function(e) {
			if (this._dragging) {
				if (this._index == null) {
					this._$children = this._$container.find(this._selector);
					this._index = this._buildIndex(this._$children);
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

			var row = this._index[r];
			var $item = row && row[c];
			if ($item && $item[0] != this._$currentTarget[0] && $item != this._$lastItem
				&& $item.next()[0] != this._$currentTarget[0]) {
				var off = $item.offset();
				this._firstPoint.x = off.left + this._internalOffset.x;
				this._firstPoint.y = off.top + this._internalOffset.y;
				$item.after(this._$currentTarget);
				this._$lastItem = $item;
			}

			this._$currentTarget.css({
				top: e.pageY - this._firstPoint.y,
				left: e.pageX - this._firstPoint.x
			});

			this._lastPoint.x = e.pageX;
			this._lastPoint.y = e.pageY;
		},

		dispose: function(e) {
			this._$document.off('mouseup', this._released);
			this._$document.off('mousemove', this._moved);
		}
	};

	return Sortable;
});