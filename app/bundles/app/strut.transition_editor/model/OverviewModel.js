/**
 * Responds to the activation / deactivation of presentation generators.
 * When one is activated OverviewModel will select the appropriate set of transition
 * editors to display and provide them as a collection to the Overview
 * view.
 */
define(['tantaman/web/Utils', 'libs/backbone'],
function(Utils, Backbone) {
	return Backbone.Model.extend({
		initialize: function() {
			this._editorModel.on('change:generator', this._generatorChanged, this);
			this._generatorChanged(this._editorModel, this._editorModel.get('generator'));
		},

		_generatorChanged: function(model, generator) {
			var editors = this._registry.get({
				interfaces: 'strut.TransitionEditor',
				meta: {
					capabilities: generator.capabilities
				}
			});

			this.transitionEditors = [];
			editors.forEach(function(entry) {
				var ctor = entry.service();
				this.transitionEditors.push(new ctor({model: this._editorModel}));
			}, this);
			
			this.trigger('change:transitionEditors', this, this.transitionEditors);
		},

		dispose: function() {
			Utils.dispose(this.transitionEditors);
			this.off();
			this._editorModel.off(null, null, this);
		},

		constructor: function OverviewModel(editorModel, registry) {
			this._editorModel = editorModel;
			this._registry = registry;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});