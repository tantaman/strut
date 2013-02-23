define(['libs/backbone'],
function(Backbone) {
	'use strict';
	// TODO: make a general class to handle all this service boilerplate.
	// ServiceCollection does most of it.
	function StorageProvidersWrapper(registry) {
		this.registry = registry;

		this.registry.on('registered:strut.StorageProvider',
			this._providerRegistered, this);

		this._getProviders();
		// TODO: handle de-registrations
		this._updateCurrentProvider();
	}

	_.extend(StorageProvidersWrapper.prototype, Backbone.Events, {
		_currentProviderId: null,
		_providerRegistered: function(providerEntry) {
			var provider = providerEntry.service();
			this.providers[provider.id] = provider;

			if (this._currentProviderId == null)
				this._currentProviderId = provider.id;

			this.trigger('change:providers.push', this.providers, provider);
			this.trigger('change:providers', this.providers, provider);
		},

		_getProviders: function() {
			var providerEntries = this.registry.get('strut.StorageProvider');
			var providers = {};
			providerEntries.forEach(function(providerEntry) {
				var provider = providerEntry.service();
				providers[provider.id] = provider;

				if (this._currentProviderId == null)
					this._currentProviderId = provider.id;
			}, this);

			this.providers = providers;
		},

		providerNames: function() {
			var result = [];

			for (var id in this.providers) {
				result.push({
					name: this.providers[id].name,
					id: id
				});
			}
		},

		currentProvider: function() {
			return this.providers[this._currentProviderId];
		},

		_updateCurrentProvider: function() {
			if (window.sessionMeta.lastProvider)
				this._currentProviderId = window.sessionMeta.lastProvider;
		}
	});

	return StorageProvidersWrapper;
});