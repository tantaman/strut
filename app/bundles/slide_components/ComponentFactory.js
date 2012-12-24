define(function() {
	'use strict';
	function ComponentFactory(registry) {
		// Look up strut.Component s
		// create our view map based on their component types
		// ComponentType must be same in model and view.
		// it is how they are mapped to one another.

		var modelEntries = registry.get('strut.ComponentModel');
		this._modelCtors = {};
		modelEntries.forEach(function(entry) {
			this._modelCtors[entry.meta().type] = entry.service();
		}, this);

		this._viewCtors = {};
		var viewEntries = registry.get('strut.ComponentView');
		viewEntries.forEach(function(entry) {
			this._viewCtors[entry.meta().type] = entry.service();
		}, this);

		this._drawers = {};
		var drawerEntries = registry.get('strut.ComponentDrawer');
		drawerEntries.forEach(function(entry) {
			this._drawers[entry.meta().type] = entry.service();
		}, this);
	}

	ComponentFactory.prototype = {
		createView: function(model) {
			var type = model.get('type');
			var ctor = this._viewCtors[type];
			if (ctor) {
				return new ctor({model: model});
			}
		},

		createModel: function(rawModel) {
            if (typeof rawModel === 'string')
                var type = rawModel;
            else
			    var type = rawModel.type;
			var ctor = this._modelCtors[type];
			if (ctor)
				return new ctor(rawModel);
		},

		getDrawer: function(type) {
			return this._drawers[type];
		}
	};

	return {
		initialize: function(registry) {
			console.log('Initing');
			if (!this.instance)
				this.instance = new ComponentFactory(registry);
		}
	};
});