define(['libs/backbone'],
function(Backbone) {
	return Backbone.Model.extend({
		initialize: function() {
			this._registry = this.get('editorModel').registry;
			this._loadGenerators();
		},

		_loadGenerators: function() {
			var generatorEntries = this._registry.get('strut.PresentationGenerator');
			generatorEntries.forEach(function() {

			});
		}
	});
});