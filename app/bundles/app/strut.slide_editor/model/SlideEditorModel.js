define(['libs/backbone'],
function(Backbone) {
	return Backbone.Model.extend({
		initialize: function() {
		},

		deck: function() {
			return this._editorModel.deck();
		},

		dispose: function() {
			console.log("Disposed of");
		},

		constructor: function SlideEditorModel(opts) {
			this._editorModel = opts.editorModel;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});