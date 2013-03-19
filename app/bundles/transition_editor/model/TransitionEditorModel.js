define(['libs/backbone'],
function(Backbone) {
	return Backbone.Model.extend({
		constructor: function TransitionEditorModel(editorModel, registry) {
			this.editorModel = editorModel;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});