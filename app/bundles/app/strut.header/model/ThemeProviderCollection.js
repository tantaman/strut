define(['libs/backbone', 'framework/ServiceCollection'],
function(Backbone, ServiceCollection) {
	function ThemeProviderCollection(editorModel) {
		this._editorModel = editorModel;

		this._activeProviders = [];
		this._editorModel.on('change:modeId', this._modeChanged, this);
		this._themeProviders =
			new ServiceCollection(editorModel.registry,
				{
					interfaces: 'strut.ThemeProvider'
				});

		this._modeChanged(null, this._editorModel.get('modeId'));
	}
	
	ThemeProviderCollection.prototype = {
		_modeChanged: function(model, newMode) {
			this._disposePrevious();
			this._themeProviders.forEach(function(providerEntry) {
				if (newMode in providerEntry.meta().modes) {
					this._addProvider(providerEntry);
				}
			}, this);

			this.trigger('change:activeProviders', this._activeProviders);
		},

		_addProvider: function(providerEntry) {
			var p = providerEntry.service().create(this._editorModel);

			if (Array.isArray(p)) {
				this._activeProviders = this._activeProviders.concat(p);
			} else {
				this._activeProviders.push(p);
			}
		},

		_disposePrevious: function() {
			this._activeProviders.forEach(function(provider) {
				provider.dispose();
			}, this);
			this._activeProviders = [];
		},

		activeProviders: function() {
			return this._activeProviders;
		}
	};

	_.extend(ThemeProviderCollection.prototype, Backbone.Events);

	return ThemeProviderCollection;
});