define(['libs/backbone'],
function(Backbone) {

	/**
	 * Model for transition editor (overview mode).
	 *
	 * @class TransitionEditorModel
	 * @augments Backbone.Model
	 */
	return Backbone.Model.extend({

		/**
		 * @returns {Deck}
		 */
		deck: function() {
			return this.editorModel.deck();
		},

		constructor: function TransitionEditorModel(editorModel, registry) {
			this.editorModel = editorModel;
			this.registry = registry;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});