define(['libs/backbone'],
function(Backbone) {
	'use strict';

	return Backbone.Model.extend({
		initialize: function() {
			this._registry = this.editorModel.registry;
			this._createButtons();

			this._registry.on('registered:strut.WellContextButtonProvider',
				this._buttonRegistered, this);
		},

		// TODO: good opportunity to start using Mixers.js...
		_createButtons: function() {
			var buttonEntries = this._registry.get('strut.WellContextButtonProvider');
			var contextButtons = [];
			buttonEntries.forEach(function(buttonEntry) {
				contextButtons = 
					contextButtons.concat(buttonEntry.service().createButtons(this.editorModel));
			}, this);

			this.set('contextButtons', contextButtons);
		},

		_buttonRegistered: function(buttonEntry) {
			var newButtons = buttonEntry.service().createButtons(this.editorModel);

			var contextButtons = this.get('contextButtons');
			newButtons.forEach(function(newButton) {
				contextButtons.push(newButton);
				this.trigger('change:contextButtons.push', contextButtons, newButton);
			}, this);
		},

		constructor: function WellContextMenuModel(editorModel) {
			this.editorModel = editorModel;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});