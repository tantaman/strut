define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		className: "providerTab",

		initialize: function() {

		},

		render: function() {
			return this;
		},

		constructor: function ProviderTab(storageInterface, editorModel) {
			Backbone.View.prototype.constructor.call(this);
			this.storageInterface = storageInterface;
			this.editorModel = editorModel;
		}
	});
});