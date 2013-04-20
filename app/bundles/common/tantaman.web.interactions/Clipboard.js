define(function() {
	function Clipboard() {
		this._item;
	}	

	Clipboard.prototype = {
		set item(val) {
			this._item = val;
		},

		get item() {
			return this._item;
		}
	};

	return Clipboard;
});