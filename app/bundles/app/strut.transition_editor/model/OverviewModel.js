define(['tantaman/web/Utils', 'libs/backbone'],
function(Utils, Backbone) {
	return Backbone.Model.extend({
		initialize: function() {
			var editors = this._registry.get({
				interfaces: 'strut.TransitionEditor'
			});

			this.transitionEditors = [];
			editors.forEach(function(entry) {
				var ctor = entry.service();
				this.transitionEditors.push(new ctor({model: this._editorModel}));
			}, this);
		},

		dispose: function() {
			Utils.dispose(this.transitionEditors);
		},

		constructor: function OverviewModel(editorModel, registry) {
			this._editorModel = editorModel;
			this._registry = registry;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});