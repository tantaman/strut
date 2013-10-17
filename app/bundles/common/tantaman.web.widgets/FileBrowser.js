define(['libs/backbone', 'css!styles/widgets/fileBrowser.css'],
function(Backbone, empty) {
	return Backbone.View.extend({
		events: {
			destroyed: 'dispose',
			'click li[data-filename]': '_fileClicked',
			'click button.close': '_deleteClicked',
			'dblclick li[data-filename]': '_fileChosen'
		},

		className: "fileBrowser",

		initialize: function() {
			this.render = this.render.bind(this);
			this.storageInterface.on("change:currentProvider", this.render);

			this.template = JST['tantaman.web.widgets/FileBrowser'];

			this.renderListing = this.renderListing.bind(this);
		},

		render: function() {
			if (!this.storageInterface.ready())
				return this;

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
			$(e.currentTarget).addClass('active');
		},

		_fileChosen: function(e) {
			this.$el.trigger('fileChosen', e.currentTarget.dataset.fileName);
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
			this.storageInterface.listPresentations().then(function(list) {
				self.$el.find('.browserContent').html(self.template({files: list}));
				self.$fileName = self.$el.find('.fileName');
			}, function(err) {
				if (err) {
					self.$el.find('.browserContent').html(err);
				}
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