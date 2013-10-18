define(['tantaman/web/storage/StorageProvidersWrapper'],
function(StorageProviders) {
	'use strict';

	function splitDocKey(docKey) {
		return docKey.substring(docKey.indexOf(':')+1)
					.split('/');
	}

	// TODO: update to use ServiceCollection
	// remove presentation specific garbage
	function StorageInterface(registry) {
		this._providers = new StorageProviders(registry);
	}

	StorageInterface.prototype = {
		validKey: function(key) {
			return key != '' && 
				key.indexOf('\u0000') == -1 &&
				key.indexOf('/') == -1 &&
				key.indexOf('\\') == -1;
		},

		ready: function() {
			return this.currentProvider() != null;
		},

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

		store: function(identifier, data, options) {
			if (data instanceof Blob) {
				throw "Use storeAttachment for saving blobs";
			} else {
				if (!options || options.json == null)
					options = {json: true};
				return this.currentProvider().setContents(identifier, data, options);
			}
		},

		load: function(identifier) {
			return this.currentProvider().getContents(identifier, {json: true});
			// release currently loaded attachments from the AttachmentCache
			// start loading all attachments for the given identifier?
		},

		remove: function(identifier) {
			return this.currentProvider().rm(identifier);
			// Tell the AttachmentCache to release its attachments
			// for the given identifier
		},

		storeAttachment: function(docKey, attachKey, blob) {
			// stores a blob
			return this.currentProvider().setAttachment(docKey, attachKey, blob);
		},

		removeAttachment: function(docKey, attachKey) {
			return this.currentProvider().rmAttachment(docKey, attachKey);
		},

		getAttachmentURL: function(docKey, attachKey) {
			return this.currentProvider().getAttachmentURL(docKey, attachKey);
		},

		revokeAllAttachmentURLs: function() {
			this.currentProvider().urlCache.revokeAllCachedURLs();
		},

		revokeAttachmentURL: function(docKey, attachKey) {
			return this.currentProvider().revokeAttachmentURL(docKey, attachKey);
		},

		list: function(path) {
			return this.currentProvider().ls(path);
		},

		listPresentations: function(path) {
			return this.currentProvider().ls();
		},

		savePresentation: function(identifier, data) {
			// var idx = identifier.indexOf('.strut');
			// if (idx == -1 || (idx + '.strut'.length != identifier.length)) {
			// 	identifier += '.strut';
			// }
			window.sessionMeta.lastPresentation = identifier;
			return this.store(identifier, data)
		}
	};

	return StorageInterface;
});