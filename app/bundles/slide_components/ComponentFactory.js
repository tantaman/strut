define(function() {
	'use strict';
	function ComponentFactory(registry) {
		// Look up strut.Component s
		// create our view map based on their component types
		// ComponentType must be same in model and view.
		// it is how they are mapped to one another.

		var models = registry.get('strut.ComponentModel');
	}

	ComponentFactory.prototype = {
		createView: function(model) {

		},

		createModel: function(rawModel) {

		},

		getDrawer: function(type) {

		}
	};

	return ComponentFactory;
});