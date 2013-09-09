define(function() {
	return {
		// todo: auto-detect the scale
		fitSizeToScale: function($elems, scale) {
			var len = $elems.length;
			for (var i = 0; i < len; ++i) {
				var $elem = $($elems[i]);
				var w = $elem.outerWidth();
				var h = $elem.outerHeight();

				var $parent = $elem.parent();
				$parent.width(w * scale);
				$parent.height(h * scale);
			}
		}
	};
});