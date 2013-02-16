define(['libs/backbone'],
function(Backbone) {
	'use strict';

	return Backbone.Model.extend({
		initialize: function() {
			this._createButtons();
			this._registry = this.editorModel.registry;

			this._registry.on('registered:strut.WellContextButton',
				this._buttonRegistered, this);
		},

		// TODO: good opportunity to start using Mixers.js...
		_createButtons: function() {
			var buttonEntries = this.registry.get('strut.WellContextButton');
			var contextButtons = [];
			buttonEntries.forEach(function(buttonEntry) {
				contextButtons.push(buttonEntry.service().createButton(this.editorModel));
			}, this);

			this.set('contextButtons', contextButtons);
		},

		_buttonRegistered: function(buttonEntry) {
			var newButton = buttonEntry.service().createButton(this.editorModel);
			this.get('contextButtons').push(newButton);
			this.trigger('change:contextButtons.push', this.get('contextButtons'), newButton);
		},

		constructor: function WellContextMenuModel(editorModel) {
			this.editorModel = editorModel;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});