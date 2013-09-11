define(function() {
	/**
	 * Clipboard class.
	 * @constructor
	 */
	function Clipboard() {
		this.items = [];
	}

	/**
	 * Makes a copy of an array of selected objects (components or slides).
	 *
	 * @param {Component[]|Slide[]} items Array of items to copy.
	 */
	Clipboard.prototype.setItems = function(items) {
		if (items.length) {
			this.items = items.slice(0);
		}
	};

	/**
	 * @returns {Component[]|Slide[]} Array of cloned objects (components or slides).
	 */
	Clipboard.prototype.getItems = function() {
		return $.map(this.items, function(item) {
			return item.clone();
		});
	};

	return Clipboard;
});