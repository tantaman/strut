define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		events: {
			destroyed: 'dispose',
			'click li[data-filename]': '_fileClicked',
			'click button.close': '_deleteClicked'
		},

		className: "fileBrowser",

		initialize: function() {
			this.render = this.render.bind(this);
			this.storageInterface.on("change:currentProvider", this.render);

			this.template = JST['bundles/storage/templates/FileBrowser'];

			this.renderListing = this.renderListing.bind(this);
		},

		render: function() {
			this.$el.html('<div class="browserContent">');
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

		_fileClicked: function(e) {
			this.$fileName.val(e.currentTarget.dataset.filename);
			this.$el.find('.active').removeClass('active');
			$(e.target).addClass('active');
		},

		_deleteClicked: function(e) {
			var $target = $(e.currentTarget);
			var $li = $target.parent().parent();
			this.storageInterface.remove($li.attr('data-filename'));
			$li.remove();

			e.stopPropagation();
			return false;
		},

		renderListing: function() {
			var self = this;
			this.storageInterface.listPresentations("/", function(list, err) {
				if (err) {
					self.$el.find('.browserContent').html(err);
				} else {
					self.$el.find('.browserContent').html(self.template({files: list}));
				}

				self.$fileName = self.$el.find('.fileName');
			});
		},

		fileName: function() {
			return this.$fileName.val();
		},

		constructor: function ProviderTab(storageInterface, editorModel) {
			this.storageInterface = storageInterface;
			this.editorModel = editorModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});