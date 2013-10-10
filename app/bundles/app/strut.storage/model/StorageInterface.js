define(['tantaman/web/storage/StorageProvidersWrapper'],
function(StorageProviders) {
	'use strict';

	// TODO: update to use ServiceCollection
	// remove presentation specific garbage
	function StorageInterface(registry) {
		this._providers = new StorageProviders(registry);
	}

	StorageInterface.prototype = {
		providerNames: function() {
			return this._providers.providerNames();
		},

		providerReady: function($el) {
			return this.currentProvider().ready($el);
		},

		activateProvider: function($el, cb) {
			this.currentProvider().activate($el, cb);
		},

		selectProvider: function(providerId) {
			this._providers.selectProvider(providerId);
		},

		currentProvider: function() {
			return this._providers.currentProvider();
		},

		currentProviderId: function() {
			return this._providers._currentProviderId;
		},

		on: function() {
			return this._providers.on.apply(this._providers, arguments);
		},

		store: function(identifier, data) {
			if (data instanceof Blob) {
				throw "Use storeAttachment for saving blobs";
			} else {
				return this.currentProvider().setContents(identifier, data);
			}
		},

		load: function(identifier) {
			return this.currentProvider().getContents(identifier);
			// release currently loaded attachments from the AttachmentCache
			// start loading all attachments for the given identifier?
		},

		remove: function(identifier) {
			return this.currentProvider().rm(identifier);
			// Tell the AttachmentCache to release its attachments
			// for the given identifier
		},

		storeAttachment: function(identifier, blob) {
			// stores a blob
		},

		loadAttachment: function(identifier) {
			// return objectURL for the attachment
			// check the attachment cache
		},

		removeAttachment: function(identifier) {
			// remove the attachment...
		},

		list: function(path) {
			return this.currentProvider().ls(path, /.*/);
		},

		listPresentations: function(path) {
			return this.currentProvider().ls(path, /.*\.strut$/);
		},

		savePresentation: function(identifier, data) {
			var idx = identifier.indexOf('.strut');
			if (idx == -1 || (idx + '.strut'.length != identifier.length)) {
				identifier += '.strut';
			}
			window.sessionMeta.lastPresentation = identifier;

			return this.store(identifier, data)
		}
	};

	return StorageInterface;
});