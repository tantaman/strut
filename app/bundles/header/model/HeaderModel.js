define(['libs/backbone'],
function(Backbone) {
	return Backbone.Model.extend({
		initialize: function() {
			this._createModeButtons();
			this._createCreateCompButtons();

			this.registry.on('register:strut.CreateCompButtonProvider',
				this._createCompProviderRegistered, this);
			this.registry.on('register:strut.EditMode',
				this._editModeRegistered, this);
		},

		_createModeButtons: function() {
			this._disposeObjects(this.get('modeButtons'));
			var editModes = this.registry.get('strut.EditMode');

			var modeButtons = [];
			editModes.forEach(function(mode) {
				var button = mode.service().createButton();
				modeButtons.push(button);
			}, this);

			this.set('modeButtons', modeButtons);
		},

		_createCreateCompButtons: function() {
			this._disposeObjects(this.get('createCompButtons'));
			var providers = this.registry.get('strut.CreateCompButtonProvider');

			var createCompButtons = [];
			providers.forEach(function(provider) {
				var buttons = provider.createButtons();
				createCompButtons = createCompButtons.concat(buttons);
			}, this);

			this.set('createCompButtons', createCompButtons);
		},

		_editModeRegistered: function(service) {
			var newButton = service.createButton();
			this.get('modeButtons').push(service.createButton());
			this.trigger('change:modeButtons.push', this.get('modeButtons'), newButton);
		},

		_createCompProviderRegistered: function(service) {
			var newButtons = service.createButtons();
			this.set('createCompButtons', this.get('createCompButtons').concat(newButtons));
			this.trigger('change:createCompButtons.concat',
				this.get('createCompButtons'), newButtons);
		},

		_disposeObjects: function(objects) {
			if (objects)
				objects.forEach(function(object) {
					object.dispose();
				})
		},

		constructor: function HeaderModel(registry) {
			this.registry = registry;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});