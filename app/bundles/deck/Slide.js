define(['libs/backbone',
		'./SpatialObject',
		'common/Math2',
		'bundles/slide_components/ComponentFactory',
		'bundles/undo_support/CmdListFactory'],
function(Backbone, SpatialObject, Math2, ComponentFactory, CmdListFactory) {
	'use strict';
	ComponentFactory = ComponentFactory.instance;
	var undoHistory = CmdListFactory.managedInstance('editor');
	var defaults = {
		z: 0,
		impScale: 1,
		rotateX: 0,
		rotateY: 0,
		rotateZ: 0
	};

	return SpatialObject.extend({
		initialize: function() {
			SpatialObject.prototype.initialize.apply(this, arguments);
			var components = this.get('components');
			if (!components) {
				this.set('components', []);
			} else {
				var hydratedComps = [];
				this.set('components', hydratedComps);
				components.forEach(function(rawComp) {
					if (rawComp instanceof Backbone.Model) {
						var comp = rawComp.clone();
						hydratedComps.push(comp);
					} else {
						var comp = ComponentFactory.createModel(rawComp);
						hydratedComps.push(comp);
					}

					this._registerWithComponent(comp);
				}, this);
			}

			_.defaults(this.attributes, defaults);

			this.on('unrender', this._unrendered, this);
		},

		_unrendered: function() {
			this.get('components').forEach(function(component) {
				component.trigger('unrender', true);
			});
		},

		_registerWithComponent: function(component) {
			component.on('dispose', this.removeComponent, this);
			component.on('change:selected', this._componentSelectionChanged, this);
			component.on('change', this._componentChanged, this);
		},

		positionData: function() {
			return {
				x: this.attributes.x,
				y: this.attributes.y,
				z: this.attributes.z,
				impScale: this.attributes.impScale,
				rotateX: this.attributes.rotateX,
				rotateY: this.attributes.rotateY,
				rotateZ: this.attributes.rotateZ
			};
		},

		addComponent: function(comp) {
			this._placeComponent(comp);

			var cmd = new AddComponentCmd(this, comp);
			cmd.do();
			undoHistory.push(cmd);
		},

		__doAdd: function(comp) {
			this.attributes.components.push(comp);
			this._registerWithComponent(comp);
			this.trigger('contentsChanged');
			this.trigger('change:components.add', this, comp);
		},

		_placeComponent: function(comp) {
			this.attributes.components.forEach(function(existingComp) {
				var existingX = existingComp.get('x');
				var existingY = existingComp.get('y');

				if (Math2.compare(existingX, comp.get('x'), 5) &&
					Math2.compare(existingY, comp.get('y'), 5)) {
					comp.set({
						x: existingX + 20,
						y: existingY + 20
					});
				}
			});
		},

		dispose: function() {
			this.set({
				active: false,
				selected: false
			});

			this.trigger('dispose', this);
			// TODO: why not off()?
			this.off('dispose');
		},

		removeComponent: function(comp) {
			var cmd = new RemoveComponentCmd(this, comp);
			cmd.do();

			undoHistory.push(cmd);
		},

		__doRemove: function(comp) {
			var idx = this.attributes.components.indexOf(comp);
			if (idx >= 0) {
				this.attributes.components.splice(idx, 1);
				this.trigger('contentsChanged');
				this.trigger('change:components.remove', this, comp);
				comp.trigger('unrender');
				comp.off(null, null, this);
				return comp;
			} else {
				return null;
			}
		},

		_componentChanged: function(model, value) {
			this.trigger('contentsChanged');
		},

		unselectComponents: function() {
			if (this.lastSelection)
				this.lastSelection.set('selected', false);
		},

		selectionChanged: function(model, selected) {
			if (selected) {
				if (this.lastSelection !== model) {
					this.attributes.components.forEach(function(comp) {
						if (comp !== model) {
							comp.set('selected', false);
						}
					});
					this.lastSelection = model;
					this.trigger('change:activeComponent', this, model, selected);
				}
			} else {
				this.trigger('change:activeComponent', this, null);
				this.lastSelection = null;
			}
		},

		constructor: function Slide() {
			SpatialObject.prototype.constructor.apply(this, arguments);
		}
	});
});