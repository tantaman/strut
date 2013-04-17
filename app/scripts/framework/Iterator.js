define(function() {
	function Factory(val) {
		if (Array.isArray(val) || val instanceof Array) {
			return new ArrayIterator(val);
		} else {
			return new ObjectIterator(val);
		}
	}

	function ArrayIterator(val) {
		this._val = val;
		this._crsr = 0;
	}

	ArrayIterator.prototype = {
		next: function() {
			return this._val[this._crsr++];
		},

		hasNext: function() {
			return this._crsr < this._val.length;
		}
	};

	function ObjectIterator(val) {
		this._object = val;
		this._iter = new ArrayIterator(Object.keys(val));
	}

	ObjectIterator.prototype = {
		next: function() {
			return this._object[this._iter.next()];
		},

		hasNext: function() {
			return this._iter.hasNext();
		}
	};

	return Factory;
});