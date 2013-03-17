define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		events: {
			destroyed: 'dispose'
		},

		className: "fileBrowser",

		initialize: function() {
			this.render = this.render.bind(this);
			this.storageInterface.on("change:currentProvider", this.render);

			this.template = JST['bundles/storage/templates/FileBrowser'];

			this.renderListing = this.renderListing.bind(this);
		},

		render: function() {
			this.$el.html('');
			if (this.storageInterface.providerReady(this.$el)) {
				this.renderListing();
			} else {
				this.storageInterface.activateProvider(this.$el, this.renderListing);
			}

			return this;
		},

		dispose: function() {
			this.storageInterface.off(null, null, this);
		},

		renderListing: function() {
			var self = this;
			this.storageInterface.listPresentations("/", function(list, err) {
				if (err) {
					self.$el.html(err);
				} else {
					self.$el.html(self.template({files: list}));
				}
			});
		},

		fileName: function() {
			return this.selectedFile;
		},

		constructor: function ProviderTab(storageInterface, editorModel) {
			this.storageInterface = storageInterface;
			this.editorModel = editorModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});