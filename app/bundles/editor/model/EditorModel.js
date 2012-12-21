define(['libs/backbone',
		'bundles/header/model/HeaderModel',
		'bundles/presentation_generator/model/PresentationGeneratorCollection',
		'bundles/deck/Deck',
		'bundles/slide_components/ComponentFactory'],
function(Backbone, Header, PresentationGeneratorCollection, Deck, ComponentFactory) {
	var componentFactory = null;
	return Backbone.Model.extend({
		initialize: function() {
			this._loadStorageProviders();
			this._loadLastPresentation();

			this.set('presentationGenerators', 
				new PresentationGeneratorCollection(this));
			this.set('header', new Header(this.registry, this));

			this.set('modeId', 'slide-editor');
			this._createMode();

			if (componentFactory == null) {
				componentFactory = new ComponentFactory(this.registry);
			}
		},

		changeActiveMode: function(modeId) {
			if (modeId != this.get('modeId')) {
				this.set('modeId', modeId);
				this._createMode();
			}
		},

		deck: function() {
			return this._deck;
		},

		createComponent: function(type) {

		},

		_createMode: function() {
			var modeId = this.get('modeId');
			var modeService = this.registry.getBest({
				interfaces: 'strut.EditMode',
				meta: { id: modeId }
			});

			if (modeService) {
				var prevMode = this.get('activeMode');
				if (prevMode)
					prevMode.close();
				this.set('activeMode', modeService.getMode(this, this.registry));
			}
		},

		_loadLastPresentation: function() {
			// Look in localStorage for a preferred provider
			// and access information

			// attempt connection to prefferd provider
			this._deck = new Deck();
		},

		_loadStorageProviders: function() {
			var providers = this.registry.getInvoke('strut.StorageProvider', 'create');
			this.set('storageProviders', providers);
		},

		_loadGenerators: function() {
			
		},

		constructor: function EditorModel(registry) {
			this.registry = registry;
			Backbone.Model.prototype.constructor.call(this);
		}
	});
});