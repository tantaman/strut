define(['libs/backbone',
		'bundles/header/model/Header'],
function(Backbone, Header) {
	return Backbone.Model.extend({
		initialize: function() {
			this._loadStorageProviders();
			this._loadLastPresentation();

			this._loadModes();

			this.set('header', new Header());
		},

		activeMode: function() {

		},

		_loadLastPresentation: function() {
			// Look in localStorage for a preferred provider
			// and access information

			// attempt connection to prefferd provider
		},

		_loadModes: function() {
			// Look for mode contributors
			// Load them into the editor
			var modes = this.get('registry').getInvoke('strut.ModeContributor', 'createModel', [this]);
			this.set('modes', modes);
		},

		_loadStorageProviders: function() {
			var providers = this.get('registry').getInvoke('strut.StorageProvider', 'create');
			this.set('storageProviders', providers);
		},

		constructor: function Editor() {
			Backbone.Model.prototype.constructor.apply(this, arguments);
		}
	});
});