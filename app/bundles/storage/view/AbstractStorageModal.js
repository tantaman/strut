define(['libs/backbone', './ProviderTab'],
function(Backbone, ProviderTab) {
	return Backbone.View.extend({
		className: "storageModal modal hide",
		events: {
			'click .providerTab': '_providerSelected'
		},

		initialize: function() {
			this.storageInterface = this.options.storageInterface;
			this.editorModel = this.options.editorModel;
			delete this.options.storageInterface;
			delete this.options.editorModel;

			this.template = JST['bundles/storage/templates/StorageModal'];

			this.storageInterface.on('change:providers', this.render, this);
			this.providerTab = new ProviderTab(this.storageInterface, this.editorModel);
		},

		render: function() {
			// Create a tab for each provider?
			// Each tab will list the presentations currently saved with that provider
			// and also have a 'save' or 'open' button.

			// Don't load the data for a provider until its tab is selected...
			var providerNames = this.storageInterface.providerNames();
			this.$el.html(this.template({
				title: this.__title(),
				tabs: providerNames
			}));

			this._renderProvider(this.storageInterface.currentProvider());
		},

		show: function() {
			this.$el.modal('show');
		},

		__title: function() { return 'none'; },

		_providerSelected: function() {

		},

		_renderProvider: function(provider) {
			//this.providerTab.update(provider);
		},

		constructor: function AbstractStorageModal() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});