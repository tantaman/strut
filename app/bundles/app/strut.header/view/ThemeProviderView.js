define(['libs/backbone', '../model/ThemeProviderCollection'],
function(Backbone, ThemeProviderCollection) {
	return Backbone.View.extend({
		className: 'themeProviders',

		initialize: function(editorModel) {
			this._providerCollection = new ThemeProviderCollection(editorModel, {overflow: false});

			this._providerCollection.on('change:activeProviders', this.render, this);
		},

		render: function() {
			this.$el.empty();

			this._providerCollection.activeProviders().forEach(function(provider) {
				this.$el.append(provider.view().render().$el);
			}, this);

			return this;
		},

		constructor: function ThemeProviderView(editorModel) {
			Backbone.View.prototype.constructor.call(this, editorModel);
		}
	});
});