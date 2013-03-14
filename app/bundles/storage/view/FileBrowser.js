define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		className: "fileBrowser",

		initialize: function() {
			this.render = this.render.bind(this);
			this.storageInterface.on("change:currentProvider", this.render);

			this.template = JST['bundles/storage/templates/FileBrowser'];
		},

		render: function() {
			this.$el.html('');
			if (this.storageInterface.providerReady()) {
				this.renderListing();
			} else {
				this.storageInterface.activateProvider(this.$el);
			}

			return this;
		},

		renderListing: function() {
			var self = this;
			this.storageInterface.listPresentations("/", function(list, err) {
				if (err) {
					self.$el.html(err);
				} else {
					self.$el.html(self.template(list));
				}
			});
		},

		constructor: function ProviderTab(storageInterface, editorModel) {
			this.storageInterface = storageInterface;
			this.editorModel = editorModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});