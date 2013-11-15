define(['libs/backbone'],
function(Backbone) {

	/**
	///////////////////////
	* So at first glance this must look really strange.
	* A model that is holding and creating views?  WTF?
	*
	* Well think about the role of a model for a bit.
	* Expand your mind.
	*
	* First, this is holding views as data.  It doesn't
	* reference any DOM, or jQuery stuff.  That makes it
	* slight less sinful.
	*
	* Second, what is the role of a model?
	* A model is supposed to encapsulate business logic
	* or its problem domain.
	*
	* What is the problem domain of a generic header?
	* A header just holds stuff and what a header holds is widgets.
	* So the problem domain of a header is the problem of managing its contents.
	* A problem domain of managing views.
	* 
	* Ok, so why the f* did you not just put all those "views" that
	* are being "managed" into your markup?  That is what markup is for, right?
	*
	* Markup is too rigid and static.  The issue is that our
	* header is really dynamic.  If someone loads in a 3rd
	* party extension, the header updates.
	*
	* If someone removes some bundles from features.js, the header changes.
	* It would also be really stupid if extensions had 
	* to call our header and add themselves to it.  It'd be adding a 
	* dependency on our header API to our extensions.
	*
	* So this header model manages the "views" provided by different
	* extension in a magical way.  Extensions don't know the header
	* exists, the header doesn't know any specific extension exists.
	* This model asks the service registry what various services exist
	* that it believes should have a representation in the header
	* and then generates views from those services.
	*
	*/
	return Backbone.Model.extend({
		initialize: function() {
			// this._createModeButtons();
			// this._createCreateCompButtons();
			this.set('createCompButtons', []);
			this.set('modeButtons', []);

			// TODO: update to use ServiceCollection and remove the boilerplate.
			this.registry.on('registered:strut.ComponentButtonProvider',
				this._compBtnProviderRegistered, this);
			this.registry.on('registered:strut.EditMode',
				this._modeRegistered, this);
		},

		editorModel: function() { return this._editorModel; },

		_createModeButtons: function() {
			this._disposeObjects(this.get('modeButtons'));
			var buttonEntries = this.registry.get('strut.EditMode');
			var modeButtons = [];
			buttonEntries.forEach(function(buttonEntry) {
				modeButtons.push(buttonEntry.service().createButton(this._editorModel));
			}, this);

			this.set('modeButtons', modeButtons);
		},

		_createCreateCompButtons: function() {
			this._disposeObjects(this.get('createCompButtons'));
			var providers = this.registry.get('strut.ComponentButtonProvider');

			var createCompButtons = [];
			providers.forEach(function(provider) {
				var buttons = provider.service().createButtons(this._editorModel);
				createCompButtons = createCompButtons.concat(buttons);
			}, this);

			this.set('createCompButtons', createCompButtons);
		},

		_modeRegistered: function(newMode) {
			var newButton = newMode.service().createButton(this._editorModel);
			this.get('modeButtons').push(newButton);
			this.trigger('change:modeButtons.push', this.get('modeButtons'), newButton);
		},

		_compBtnProviderRegistered: function(entry) {
			var newButtons = entry.service().createButtons(this._editorModel);
			this.set('createCompButtons', this.get('createCompButtons').concat(newButtons));
			this.trigger('change:createCompButtons.concat',
				this.get('createCompButtons'), newButtons);
		},

		_disposeObjects: function(objects) {
			if (objects)
				objects.forEach(function(object) {
					object.dispose();
				});
		},

		constructor: function HeaderModel(registry, editorModel) {
			this.registry = registry;
			this._editorModel = editorModel;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});