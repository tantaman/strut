define(['libs/backbone'],
function(Backbone) {
	'use strict';

	return Backbone.Model.extend({
		initialize: function() {
			this.subs = [];
			this._registry = this.editorModel.registry;
			// this._createButtons();
			this.set('contextButtons', []);

			this.subs.push(this._registry.on('registered:strut.WellContextButtonProvider',
			this._buttonRegistered, this));
      		this._slideIndex = 0;
		},

		// TODO: good opportunity to start using Mixers.js...
		_createButtons: function() {
			var buttonEntries = this._registry.get('strut.WellContextButtonProvider');
			var contextButtons = [];
			buttonEntries.forEach(function(buttonEntry) {
				contextButtons = 
					contextButtons.concat(buttonEntry.service().createButtons(this.editorModel, this));
			}, this);

			this.set('contextButtons', contextButtons);
		},

    	slideIndex: function(i) {
      		if (i == null)
        		return this._slideIndex;
      		else
         		this._slideIndex = i;
    	},

    	dispose: function() {
    		console.log('DISPOSING CONTEXT MENU!');
    		this.subs.forEach(function(sub) {
    			sub.dispose();
    		});
    	},

		_buttonRegistered: function(buttonEntry) {
			var newButtons = buttonEntry.service().createButtons(this.editorModel, this);

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
