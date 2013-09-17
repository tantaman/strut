/**
 * @author Matt Crinklaw-Vogt
 */
define(["./ComponentView", "common/Math2"], function(ComponentView, Math2) {
	var twoPI = Math.PI * 2;

	/**
	 * @class ThreeDRotatableComponentView
	 * @augments ComponentView
	 */
	return ComponentView.extend({
		transforms: ["rotateX", "rotateY", "rotateZ", "scale"],

		/**
		 * Returns list of events, tracked by this view.
		 *
		 * @returns {Object}
		 */
		events: function() {
			var parentEvents;
			parentEvents = ComponentView.prototype.events();
			return _.extend(parentEvents, {
				"mousedown .form-inline": "stopProp",
				"deltadragStart span[data-delta='rotateX']": "rotateXStart",
				"deltadrag span[data-delta='rotateX']": "rotateX",
				"deltadragStart span[data-delta='rotateZ']": "rotateZStart",
				"deltadrag span[data-delta='rotateY']": "rotateY",
				"deltadragStart span[data-delta='rotateY']": "rotateYStart",
				"deltadrag span[data-delta='rotateZ']": "rotateZ",
				"change input[data-option='z']": "manualMoveZ",
				"change input[data-option='scale']": "manualMoveScale",
				"change input[data-option='rotateX']": "manualRotX",
				"change input[data-option='rotateY']": "manualRotY",
				"change input[data-option='rotateZ']": "manualRotZ"
			});
		},

		/**
		 * Initialize ThreeDRotatableComponentView component view.
		 */
		initialize: function() {
			ComponentView.prototype.initialize.apply(this, arguments);
			this.model.on("change:rotateX", this._rotXChanged, this);
			this.model.on("change:rotateY", this._rotYChanged, this);
			return this.model.on("change:rotateZ", this._rotZChanged, this);
		},

		stopProp: function(e) {
			e.stopPropagation();
		},

		dispose: function() {
			this.model.off(null, null, this);
		},

		manualMoveScale: function(e) {
			return this.model.setFloat("impScale", e.target.value);
		},

		manualMoveZ: function(e) {
			return this.model.setInt("z", e.target.value);
		},

		manualRotX: function(e) {
			return this.model.setFloat("rotateX", Math2.toRads(e.target.value));
		},

		manualRotY: function(e) {
			return this.model.setFloat("rotateY", Math2.toRads(e.target.value));
		},

		manualRotZ: function(e) {
			return this.model.setFloat("rotateZ", Math2.toRads(e.target.value));
		},

		rotateXStart: function(e, deltas) {
			this.updateOrigin();
			this._rotXOffset = this._calcRot(deltas);
			return this._initialRotX = this.model.get("rotateX") || 0;
		},

		rotateX: function(e, deltas) {
			var rot;
			rot = (deltas.dy * .02) % twoPI;
			return this.model.setFloat("rotateX", this._initialRotX + rot);
		},

		_rotXChanged: function(model, value) {
			this.$rotXInput.val(Math2.round(Math2.toDeg(value), 2));
			return this._setUpdatedTransform();
		},

		rotateYStart: function(e, deltas) {
			this.updateOrigin();
			this._rotYOffset = this._calcRot(deltas);
			return this._initialRotY = this.model.get("rotateY") || 0;
		},

		rotateY: function(e, deltas) {
			var rot;
			rot = (deltas.dx * .02) % twoPI;
			return this.model.setFloat("rotateY", this._initialRotY + rot);
		},

		_rotYChanged: function(model, value) {
			this.$rotYInput.val(Math2.round(Math2.toDeg(value), 2));
			return this._setUpdatedTransform();
		},

		rotateZStart: function(e, deltas) {
			this.updateOrigin();
			this._rotZOffset = this._calcRot(deltas);
			return this._initialRotZ = this.model.get("rotateZ") || 0;
		},

		rotateZ: function(e, deltas) {
			var rot;
			rot = this._calcRot(deltas);
			return this.model.setFloat("rotateZ", this._initialRotZ + rot - this._rotZOffset);
		},

		_rotZChanged: function(model, value) {
			this.$rotZInput.val(Math2.round(Math2.toDeg(value), 2));
			return this._setUpdatedTransform();
		},

		/**
		 * Render element based on component model.
		 *
		 * @returns {*}
		 */
		render: function() {
			ComponentView.prototype.render.apply(this, arguments);
			this.$rotXInput = this.$el.find("[data-option='rotateX']");
			this.$rotYInput = this.$el.find("[data-option='rotateY']");
			this.$rotZInput = this.$el.find("[data-option='rotateZ']");
			return this;
		},

		/**
		 * Get view template.
		 *
		 * @returns {*}
		 * @private
		 */
		__getTemplate: function() {
			return null;
		},

		constructor: function ThreeDRotatableComponentView() {
			ComponentView.prototype.constructor.apply(this, arguments);
		}
	});
});
