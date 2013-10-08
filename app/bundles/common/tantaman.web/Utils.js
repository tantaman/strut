define(function() {
	return {
		dispose: function(arg) {
			if (arg.dispose != null) {
				arg.dispose();
			} else if (arg.forEach != null) {
				arg.forEach(function(e) {
					e.dispose();
				});
			}
		},

		stopProp: function(e) {
			e.stopPropagation();
		}
	}
});