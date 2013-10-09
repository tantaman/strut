define(['libs/backbone',
		'ServiceRegistry'],
function(Backbone, SR) {
	return Backbone.Model.extend({
		initialize: function() {
			this.items = new SR.ServiceCollection(
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