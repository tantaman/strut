define(['libs/backbone', 'framework/ServiceCollection'],
function(Backbone, ServiceCollection) {
	function ThemeProviderCollection(editorModel, meta) {
		this._editorModel = editorModel;

		this._activeProviders = [];
		this._editorModel.on('change:activeMode', this._modeChanged, this);
		this._themeProviders =
			new ServiceCollection(editorModel.registry,
				{
					interfaces: 'strut.ThemeProvider',
					meta: meta
				});

		this._modeChanged(null, this._editorModel.get('activeMode'));

		this._themeProviders.on('registered', function(item, entry) {
			this._addProvider(entry);
		}, this);
	}
	
	ThemeProviderCollection.prototype = {
		_modeChanged: function(model, newMode) {
			this._disposePrevious();
			this._themeProviders.forEach(function(providerEntry) {
				if (newMode.id in providerEntry.meta().modes) {
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