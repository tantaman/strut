define(function() {
	'use strict';
	var managedInstances = {};
	return {
		create: function(opts) {

		},

		managedInstance: function(key, opts) {
			var instance = managedInstances[key];
			if (!instance) {
				instance = this.create(opts);
				managedInstances[key] = instance;
			}
			return instance;
		}
	};
});