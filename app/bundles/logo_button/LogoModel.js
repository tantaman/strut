define(['libs/backbone'],
function(Backbone) {
	return Backbone.Model.extend({
		initialize: function() {
			
		},
		
		constructor: function LogoModel(editorModel) {
			this._editorModel = editorModel;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});