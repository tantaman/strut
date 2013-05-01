define(function() {
	function Clipboard() {
		this.item;
	}	

	Clipboard.prototype = {
		// Not supported on mobile ;*(
		// set item(val) {
		// 	this._item = val;
		// },

		// get item() {
		// 	return this._item;
		// }
	};

	return Clipboard;
});