define(['./CmdList'],
function(CmdList) {
	'use strict';
	var managedInstances = {};
	return {
		create: function(opts) {
			opts = opts || {};
			return new CmdList(opts.size || 20);
		},

		// TODO: this should be gotten from the editor model
		// and not some global managed instance.
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