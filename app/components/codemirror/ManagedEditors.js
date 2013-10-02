define(['codemirror/codemirror', 'codemirror/modes/xml'],
function(CodeMirror, xml) {
	var editors = {};

	function createEditor(opts, cb) {
		var result = {};
		var mirror = CodeMirror(function(el) {
			result.el = el;
			if (cb) cb(el);
		}, opts);

		result.mirror = mirror;

		return result;
	}

	return {
		getEditor: function(name, opts, cb) {
			return editors[name] || (editors[name] = createEditor(opts, cb));
		}
	};
});