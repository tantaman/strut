define(['libs/backbone', 'tantaman/web/widgets/FileBrowser', 'css!styles/storage/storageModal.css'],
function(Backbone, FileBrowser) {
	return Backbone.View.extend({
		className: "storageModal modal hide",
		events: {
			'click a[data-provider]': '_providerSelected',
			'click .ok': '_okClicked',
			'destroyed': 'dispose'
		},

		initialize: function() {
			this.storageInterface = this.options.storageInterface;
			this.editorModel = this.options.editorModel;
			delete this.options.storageInterface;
			delete this.options.editorModel;

			this.template = JST['strut.storage/StorageModal'];

			this.storageInterface.on('change:providers', this.render, this);
			this.storageInterface.on('change:currentProvider', this._providerChanged, this);
			this.fileBrowser = new FileBrowser(this.storageInterface, this.editorModel);
		},

		title: function(title) {
			this.$el.find('.title').html(title);
		},

		dispose: function() {
			this.storageInterface.off(null, null, this);
		},

		render: function() {
			// Create a tab for each provider?
			// Each tab will list the presentations currently saved with that provider
			// and also have a 'save' or 'open' button.

			// Don't load the data for a provider until its tab is selected...
			var providerNames = this.storageInterface.providerNames();
			this.fileBrowser.$el.detach();
			this.$el.html(this.template({
				title: this.__title(),
				tabs: providerNames
			}));

			this._providerChanged();
			this.$el.find('.tabContent').append(this.fileBrowser.$el);
		},

		show: function(actionHandler, title) {
			this.actionHandler = actionHandler;
			this.title(title);
			this.fileBrowser.render();
			this.$el.modal('show');
		},

		_providerChanged: function() {
			if (this.$lastProviderTab) {
				this.$lastProviderTab.removeClass('active');
			}

			this.$lastProviderTab = 
				this.$el.find('[data-provider="' + 
					this.storageInterface.currentProviderId() + '"]').parent();

			this.$lastProviderTab.addClass('active');
		},

		__title: function() { return 'none'; },

		_okClicked: function() {
			if (this.actionHandler) {
				if (this.fileBrowser.fileName() == "") {
					// Present some message..
					return;
				}

				var self = this;
				this.actionHandler(this.storageInterface, this.editorModel,
				this.fileBrowser.fileName(),
				function(result, err) {
					if (!err) {
						self.$el.modal('hide');
					} else {
						// display the err
					}
				});
			}
		},

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