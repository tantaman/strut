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

		_loadLastPresentation: function() {
			// Look in localStorage for a preferred provider
			// and access information

			// attempt connection to prefferd provider
		},

		_loadModes: function() {
			// Look for mode contributors
			// Load them into the editor
			var registry = this.get('registry');

			var services = registry.get('strut.ModeContributor');

			var modes = {};
			services.forEach(function(entry) {
				var mode = entry.service().create(this);
				modes[mode.id] = mode;
			}, this);

			this.set('modes', modes);
		},

		_loadStorageProviders: function() {
			var registry = this.get('registry');

			var services = registry.get('strut.StorageProvider');

			var providers = {};
			services.forEach(function(entry) {
				var provider = entry.service().create();
				providers[provider.id] = provider;
			}, this);
			this.set('storageProviders', providers);
		}
	});
});