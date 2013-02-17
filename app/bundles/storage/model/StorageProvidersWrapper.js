define(['libs/backbone'],
function(Backbone) {
	// TODO: make a general class to handle all this service boilerplate.
	// ServiceCollection does most of it.
	function StorageProvidersWrapper(registry) {
		this.registry = registry;

		this.registry.on('registered:strut.StorageProvider',
			this._providerRegistered, this);

		this._getProviders();
		// TODO: handle de-registrations
	}

	_.extend(StorageProvidersWrapper.prototype, Backbone.Events, {
		_providerRegistered: function(providerEntry) {
			var provider = providerEntry.service();
			this.providers.push(provider);

			this.trigger('change:providers.push', this.providers, provider);
			this.trigger('change:providers', this.providers, provider);
		},

		_getProviders: function() {
			var providerEntries = this.registry.get('strut.StorageProvider');
			var providers = [];
			providerEntries.forEach(function(providerEntry) {
				providers.push(providerEntry.service());
			}, this);

			this.providers = providers;
		},

		providerNames: function() {
			return _.pluck(this.providers, 'name');
		}
	});

	return StorageProvidersWrapper;
});