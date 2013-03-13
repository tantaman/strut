define(['./StorageProvidersWrapper'],
function(StorageProviders) {
	'use strict';

	function StorageInterface(registry) {
		this._providers = new StorageProviders(registry);
	}

	StorageInterface.prototype = {
		providerNames: function() {
			return this._providers.providerNames();
		},

		currentProvider: function() {
			return this._providers.currentProvider();
		},

		on: function() {
			return this._providers.on.apply(this._providers, arguments);
		},

		save: function(identifier, data, cb) {
			this.currentProvider().setContents(identifier, data, cb);
			return this;
		},

		load: function(identifier, cb) {
			this.currentProvider().getContents(identifier, cb);
			return this;
		},

		remove: function(identifier, cb) {
			this.currentProvider().rm(identifier, cb);
			return this;
		},

		list: function(path, cb) {
			this.currentProvider().ls(path, /.*/, cb);
			return this;
		},

		listPresentations: function(path, cb) {
			this.currentProvider().ls(path, /.*\.strut$/, cb)
			return this;
		}
	};

	return StorageInterface;
});