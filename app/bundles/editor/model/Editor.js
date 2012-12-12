define(['libs/backbone',
		'bundles/header/model/Header'],
function(Backbone, Header) {
	return Backbone.Model.extend({
		initialize: function() {
			this._loadStorageProviders();
			this._loadLastPresentation();

			this.set('header', new Header(this.registry));

			this.set('activeMode', this.activeMode());
		},

		activeMode: function() {
			return undefined;
		},

		_loadLastPresentation: function() {
			// Look in localStorage for a preferred provider
			// and access information

			// attempt connection to prefferd provider
		},

		_loadStorageProviders: function() {
			var providers = this.registry.getInvoke('strut.StorageProvider', 'create');
			this.set('storageProviders', providers);
		},

		constructor: function Editor(registry) {
			this.registry = registry;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});