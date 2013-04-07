define(['libs/backbone',
		'framework/ServiceCollection'],
function(Backbone, ServiceCollection) {
	return Backbone.Model.extend({
		initialize: function() {
			this.items = new ServiceCollection(
				this._editorModel.registry,
				'strut.LogoMenuItemProvider',
				this._convertServiceEntry.bind(this)
				);
		},

		_convertServiceEntry: function(entry) {
			return entry.service().createMenuItems(this._editorModel);
		},
		
		constructor: function LogoModel(editorModel) {
			this._editorModel = editorModel;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});