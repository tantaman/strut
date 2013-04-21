define(['common/EventEmitter'],
function(EventEmitter) {
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
		this._scrollParent = options.scrollParent;

		this._delta = {
			x: 0,
			y: 0
		};

		_.extend(this, new EventEmitter());
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

			this._startIndex = {
				r: (this._startOffset.top / this._h) | 0,
				c: (this._startOffset.left / this._w) | 0
			};

			this._internalOffset = {
				x: e.pageX - this._startOffset.left,
				y: e.pageY - this._startOffset.top
			};

			this._startScroll = this._scrollParent.scrollTop;

			e.preventDefault();
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

			index.first = $items[0];
			index.last = $items[$items.length - 1];

			return index;
		},

		_released: function(e) {
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

			if (!this._$children)
				return;

			var self = this;
			self._sortableEnd = 
				this._$container.find(this._selector).index(self._$currentTarget[0]);

			self._$currentTarget = undefined;
			self._$lastItem = undefined;
			self._$placeholder = undefined;

			self.emit('sortstop', self._sortableStart, self._sortableEnd);
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


					this._sortableStart = this._$children.index(this._$currentTarget[0]);

					this._$currentTarget.after(this._$placeholder);
				}

				this._doDrag(e);
			}
		},

		_doDrag: function(e) {
			// TODO: support x and y scrolls
			var scrollDelta = this._startScroll - this._scrollParent.scrollTop;
			var dy = (e.pageY - scrollDelta) - this._origPoint.y;
			var dx = e.pageX - this._origPoint.x;

			var offY = this._startOffset.top + dy;
			var offX = this._startOffset.left + dx;

			var r = (offY / this._h) | 0;
			var c = (offX / this._w) | 0;

			var targetY = (e.pageY - scrollDelta) - this._internalOffset.y;
			var targetX = e.pageX - this._internalOffset.x;

			var row = this._index[r];
			var $item = this._getClosest(row && row[c], targetX, targetY);

			if ($item && $item[0] != this._$currentTarget[0]) {
				if ($item != this._$lastItem) {
					$item.after(this._$placeholder);
					this._$lastItem = $item;
					this._lastDir = '';
				} else if ($item[0] == this._index.first) {
					// TODO: generalize to work for 2 dimensional sortables like
					// everything else.
					if (targetY < $item.position().top) {
						var placeholderTop = this._$placeholder.position().top;
						if (this._lastDir != 'before' && targetY < placeholderTop) {
							this._lastDir = 'before';
							$item.before(this._$placeholder);
						} else if (this._lastDir != 'after' && targetY > placeholderTop) {
							this._lastDir = 'after';
							$item.after(this._$placeholder);
						}
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

		dispose: function() {
			this._$document.off('mouseup', this._released);
			this._$document.off('mousemove', this._moved);
			this.removeAllListeners();
		}
	};

	return Sortable;
});