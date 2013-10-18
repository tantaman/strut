/**
 * @module model.presentation
 * @author Matt Crinklaw-Vogt
 */
define(["libs/backbone",
	"./SpatialObject",
	"strut/slide_components/ComponentFactory",
	"common/Math2", "./ComponentCommands",
	'tantaman/web/undo_support/CmdListFactory',
	"strut/editor/GlobalEvents"],
	function(Backbone, SpatialObject, ComponentFactory, Math2, ComponentCommands, CmdListFactory, key) {
		var undoHistory = CmdListFactory.managedInstance('editor');
		var defaults;

		defaults = {
			z: 0,
			impScale: 3,
			rotateX: 0,
			rotateY: 0,
			rotateZ: 0
		};

		/**
		 * Represents a slide in the presentation. Slides contain components (text boxes, videos, images, etc.) Slide fires
		 * a "contentsChanged" event whenever any of their components are updated. Slide fires "change:components.add/remove"
		 * events when components are added or removed.
		 *
		 * @class Slide
		 * @augments SpatialObject
		 */
		return SpatialObject.extend({
			type: 'slide',

			/** @param {Component[]} */
			selected: [],

			/**
			 * Initialize slide model.
			 */
			initialize: function() {
				var components, hydratedComps;
				components = this.get("components");
				if (components === undefined) {
					this.set("components", []);
				} else {
					hydratedComps = [];
					this.set("components", hydratedComps);
					components.forEach(function(rawComp) {
						var comp;
						if (rawComp instanceof Backbone.Model) {
							comp = rawComp.clone();
							hydratedComps.push(comp);
						} else {
							comp = ComponentFactory.instance.createModel(rawComp);
							hydratedComps.push(comp);
						}
						return this._registerWithComponent(comp);
					}, this);
				}
				_.defaults(this.attributes, defaults);
				this.on("unrender", this.unrendered, this);
				this.on('change:markdown', this._contentsChanged, this);

				components = this.get('components');
				components.forEach(function(comp) {
					if (comp.get('selected')) {
						this._selectionChanged(comp, true, { multiselect: true });
					}
				}, this);
			},

			/**
			 * React on slide being unrendered.
			 */
			unrendered: function() {
				this.get("components").forEach(function(component) {
					component.trigger("unrender", true);
				});
			},

			/**
			 * Register callbacks on component events.
			 *
			 * @param {Component} component
			 * @private
			 */
			_registerWithComponent: function(component) {
				component.slide = this;
				component.on("dispose", this._selectionChanged, this);
				component.on("change:selected", this._selectionChanged, this);
				component.on("change", this._contentsChanged, this);
			},

			/**
			 * Returns custom classes of the slide.
			 * @returns {string}
			 */
			customClasses: function() {
				return '';
			},

			/**
			 * Returns an object, which represents slide position.
			 * @see SlideCollection._swapTransitionPositions
			 *
			 * @returns {{x: *, y: *, z: *, impScale: *, rotateX: *, rotateY: *, rotateZ: *}}
			 */
			getPositionData: function() {
				return {
					x: this.get("x"),
					y: this.get("y"),
					z: this.get("z"),
					impScale: this.get("impScale"),
					rotateX: this.get("rotateX"),
					rotateY: this.get("rotateY"),
					rotateZ: this.get("rotateZ")
				};
			},

			/**
			 * Select given components.
			 *
			 * @param {Component|Component[]} components
			 */
			selectComponents: function(components) {
				components = _.isArray(components) ? components : [components];
				if (components.length) {
					this.get('components').forEach(function(comp) {
						return comp.set("selected", false);
					});

					components.forEach(function(component) {
						component.set("selected", true, { multiselect: true });
					});
				}
			},

			/**
			 * Unselect given components. If no components passed, then all selected coponents will be unselected.
			 *
			 * @param {Component|Component[]} [components]
			 */
			unselectComponents: function(components) {
				components = components || this.selected;
				components = _.isArray(components) ? components : [components];

				components.forEach(function(component) {
					component.set("selected", false);
				});
			},

			/**
			 * React on component selection change.
			 *
			 * @param {Component} component
			 * @param {boolean} selected
			 * @param {Object} [options]
			 * @private
			 */
			_selectionChanged: function(component, selected, options) {
				options = options || {};
				var multiselect = options.multiselect || (key.pressed.ctrl || key.pressed.meta || key.pressed.shift);

				if (selected) {
					if (!multiselect) {
						this.get('components').forEach(function(comp) {
							if (component !== comp) {
								return comp.set("selected", false);
							}
						});
					}
					if (this.selected.indexOf(component) == -1) {
						this.selected.push(component);
					}
					this.trigger("change:activeComponent", this, component, selected);
				} else {
					var idx = this.selected.indexOf(component);
					if (idx !== -1) {
						this.selected.splice(idx, 1);
					}
					this.trigger("change:activeComponent", this, undefined);
				}
			},

			/**
			 * React on component being changed.
			 *
			 * @param {Component} model
			 * @param {*} value
			 * @private
			 */
			_contentsChanged: function(model, value) {
				this.trigger("contentsChanged");
			},

			/**
			 * Adds components in a space that has not already been occupied. Triggers "contentsChanged" and
			 * "change:components.add" events. The contentsChanged event is used by the preview canvas to re-render itself.
			 * The change:components.add is used by the operating table to know to render the new component.
			 *
			 * @method
			 * @param {Component|Component[]} components The components to be added (text box, image, video, etc.)
			 */
			add: function(components) {
				components = _.isArray(components) ? components.slice() : [components];
				components.forEach(function(component) {
					this._placeComponent(component);
				}, this);
				var cmd = new ComponentCommands.Add(this, components);
				cmd.do();
				undoHistory.push(cmd);
			},

			/**
			 * Callback for component addition command.
			 * @see ComponentCommands.Add
			 *
			 * @method
			 * @param {Component[]} components The component to be added (text box, image, video, etc.)
			 */
			__doAdd: function(components) {
				components.forEach(function(component) {
					this.get('components').push(component);
					this._registerWithComponent(component);
					this.trigger("contentsChanged");
					this.trigger("change:components.add", this, component);
				}, this);
				this.selectComponents(components);
			},

			/**
			 * A pretty naive implementation but it should do the job just fine. Places a new component in a location that
			 * doesn't currently contain a component.
			 *
			 * @param {Component} component The component to be placed
			 * @private
			 */
			_placeComponent: function(component) {
				return this.get('components').forEach(function(existingComponent) {
					var existingX, existingY;
					existingX = existingComponent.get("x");
					existingY = existingComponent.get("y");
					if (Math2.compare(existingX, component.get("x"), 5) && Math2.compare(existingY, component.get("y"), 5)) {
						return component.set({
							x: existingX + 20,
							y: existingY + 20
						});
					}
				});
			},

			/**
			 * Remove one or more components from the slide.
			 *
			 * @param {Component|Component[]} components
			 */
			remove: function(components) {
				components = _.isArray(components) ? components : [components];
				undoHistory.pushdo(new ComponentCommands.Remove(this, components));
			},

			/**
			 * Callback for component removal command.
			 * @see ComponentCommands.Remove
			 *
			 * @param {Component[]} components
			 * @private
			 */
			__doRemove: function(components) {
				components.forEach(function(component) {
					var idx;
					idx = this.get('components').indexOf(component);
					if (idx !== -1) {
						this.get('components').splice(idx, 1);
						this.trigger("contentsChanged");
						this.trigger("change:components.remove", this, component);
						component.trigger("unrender");
						component.dispose();
						return component;
					} else {
						return undefined;
					}
				}, this);
			},

			/**
			 * Dispose slide from the presentation.
			 */
			dispose: function() {
				this.set({
					active: false,
					selected: false
				});
				this.trigger("dispose", this);
				this.off();
			},

			constructor: function Slide() {
				SpatialObject.prototype.constructor.apply(this, arguments);
			}
		});
	});
