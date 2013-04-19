define(["strut/editor/GlobalEvents"],
function(GlobalEvents) {
	'use strict';
	
	var funcs = ["cut", "copy", "paste"]

	result = {
		applyTo: function(obj) {
			_.bindAll(obj, funcs)

			GlobalEvents.on('cut', obj.cut, obj);
			GlobalEvents.on('copy', obj.copy, obj);
			GlobalEvents.on('paste', obj.paste, obj);
		},

		unapply: function(obj) {
			GlobalEvents.off(null, null, obj);
		}
	};
})