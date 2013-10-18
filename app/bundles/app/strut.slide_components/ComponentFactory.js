define(function() {
	'use strict';

	/**
	 * @class ComponentFactory
	 * @param {ServiceRegistry} registry
	 */
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
	}

	ComponentFactory.prototype = {
		/**
		 * Create view for a given model.
		 *
		 * @param {Component} model
		 * @returns {ComponentView}
		 */
		createView: function(model) {
			var type = model.get('type');
			var ctor = this._viewCtors[type];
			if (ctor) {
				return new ctor({model: model});
			}
		},

		/**
		 * Create a model from a given raw object.
		 *
		 * @param {Object} rawModel
		 * @param {Object} opts - additional options
		 * @returns {Component}
		 */
		createModel: function(rawModel, opts) {
			// TODO: temporary hack until
			// everyone migrates to the new serialization format
			if (rawModel.type == "ImageModel") {
				rawModel.type = "Image"
			}

			if (typeof rawModel === 'string') {
				var type = rawModel;
			} else {
				var type = rawModel.type;
			}
			var ctor = this._modelCtors[type];
			if (ctor) {
				return new ctor(rawModel, opts);
			}
		},

		/**
		 * Return drawer object for a given component type.
		 *
		 * @param {string} type
		 * @returns {AbstractDrawer|ImageDrawer|TextBoxDrawer}
		 */
		getDrawer: function(type) {
			return this._drawers[type];
		}
	};

	return {
		initialize: function(registry) {
			log('Initing');
			if (!this.instance) {
				this.instance = new ComponentFactory(registry);
			}
		}
	};
});
