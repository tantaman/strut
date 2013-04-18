define(["libs/mousetrap"],
function(Keymaster) {
	'use strict';
	
	var funcs = ["cut", "copy", "paste"]

	result = {
		applyTo: function(obj, scope) {
			_.bindAll(obj, funcs)


			Keymaster("ctrl+x, command+x", scope, obj.cut)
			Keymaster("ctrl+c, command+c", scope, obj.copy)
			Keymaster("ctrl+v, command+v", scope, obj.paste)
		},

		unapply: function(obj, scope) {

		}
	};
})