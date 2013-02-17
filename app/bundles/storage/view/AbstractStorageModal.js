define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		events: {
			'click .providerTab': '_providerSelected'
		},

		initialize: function() {
			this.storageProviders = this.options.storageProviders;
			this.editorModel = this.options.editorModel;
			delete this.options.storageProviders;
			delete this.options.editorModel;

			this.template = JST['bundles/storage/view/StorageModal'];

			this.storageProviders.on('change:providers', this.render, this);
		},

		render: function() {
			// Create a tab for each provider?
			// Each tab will list the presentations currently saved with that provider
			// and also have a 'save' or 'open' button.

			// Don't load the data for a provider until its tab is selected...
			var providerNames = this.storageProviders.providerNames();
			this.$el.html(this.template({
				title: this.__title(),
				tabs: providerNames
			}));

			// select each tab...
			// construct the view for that tab.
		},

		__title: function() { return 'none'; },

		_providerSelected: function() {

		},

		constructor: function AbstractStorageModal() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});