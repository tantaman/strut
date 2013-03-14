define(['libs/backbone', './FileBrowser', 'css!styles/storage/storageModal.css'],
function(Backbone, FileBrowser) {
	return Backbone.View.extend({
		className: "storageModal modal hide",
		events: {
			'click a[data-provider]': '_providerSelected'
		},

		initialize: function() {
			this.storageInterface = this.options.storageInterface;
			this.editorModel = this.options.editorModel;
			delete this.options.storageInterface;
			delete this.options.editorModel;

			this.template = JST['bundles/storage/templates/StorageModal'];

			this.storageInterface.on('change:providers', this.render, this);
			this.fileBrowser = new FileBrowser(this.storageInterface, this.editorModel);
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

			this.$el.find('.tabContent').append(this.fileBrowser.render().$el);
		},

		show: function() {
			this.$el.modal('show');
		},

		__title: function() { return 'none'; },

		_providerSelected: function(e) {
			// change the storage interface's selected
			// storage provider
			this.storageInterface.selectProvider(e.target.dataset.provider);
		},

		constructor: function AbstractStorageModal() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});