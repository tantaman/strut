define(['libs/backbone', '../model/ActionHandlers', 'tantaman/web/widgets/ErrorModal', 'lang'],
function(Backbone, ActionHandlers, ErrorModal, lang) {
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
				this.saveAsModal.show(ActionHandlers.save, lang.save_as);
			} else {
				ActionHandlers.save(this.storageInterface, this.model, fileName, ErrorModal.show);
			}
		},

		render: function() {
			this.$el.html('<a>' + lang.save + '</a>');
			return this;
		}
	});
});