define(['libs/backbone'],
function(Backbone) {
	return Backbone.Collection.extend({
		initialize: function() {
			this._registry = this._editorModel.registry;
			this._loadGenerators();
		},

		_loadGenerators: function() {
			var generatorEntries = this._registry.get('strut.presentation_generator');
			generatorEntries.forEach(function() {
				
			});
		},

		constructor: function(editorModel) {
			this._editorModel = editorModel;
			Backbone.Collection.prototype.constructor.call(this);
		}
	});
});