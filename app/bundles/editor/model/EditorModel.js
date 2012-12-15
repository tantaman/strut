define(['libs/backbone',
		'bundles/header/model/HeaderModel'],
function(Backbone, Header) {
	return Backbone.Model.extend({
		initialize: function() {
			this._loadStorageProviders();
			this._loadLastPresentation();

			this.set('header', new Header(this.registry));

			this._createMode();
		},

		_createMode: function() {
			var modeId = 'slide-editor';
			var modeService = this.registry.getBest({
				interfaces: 'strut.EditMode',
				meta: { id: modeId }
			});

			if (modeService)
				this.set('activeMode', modeService.createMode(this.model));
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