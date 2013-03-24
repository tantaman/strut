define(['libs/backbone'],
function(Backbone) {
	return Backbone.Model.extend({
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