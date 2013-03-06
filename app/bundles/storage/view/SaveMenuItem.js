define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		tagName: 'li',
		events: {
			click: 'save'
		},

		constructor: function SaveMenuItem(modal, model, storageInterface) {
			Backbone.View.prototype.constructor.call(this);
			this.model = model;
			this.saveAsModal = modal;
			this.storageInterface = storageInterface;
		},

		save: function() {
			fileName = this.model.fileName();
			if (fileName == null) {
				this.saveAsModal.show();
			} else {
				this.storageInterface.save(fileName, this.model.exportPresentation(),
					function() {
						// TODO: error handling?
					});
			}
		},

		render: function() {
			this.$el.html('<a>Save</a>');
			return this;
		}
	});
});