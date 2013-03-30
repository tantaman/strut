define(function() {
	function Adapter(wrapped, methodMap) {
		var keys = Object.keys(methodMap);
		keys.forEach(function(from) {
			var to = methodMap[from];
			this[from] = function() {
				return wrapped[to].apply(wrapped, arguments);
			}
		}, this);
	}

	return Adapter;
});