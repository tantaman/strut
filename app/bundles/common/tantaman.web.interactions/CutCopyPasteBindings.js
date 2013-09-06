define(["strut/editor/GlobalEvents"],
function(GlobalEvents) {
	'use strict';

	result = {
		applyTo: function(obj) {
			GlobalEvents.on('cut', obj.cut, obj);
			GlobalEvents.on('copy', obj.copy, obj);
			GlobalEvents.on('paste', obj.paste, obj);
			GlobalEvents.on('delete', obj.delete, obj);
		},

		unapply: function(obj) {
			GlobalEvents.off(null, null, obj);
		}
	};
})