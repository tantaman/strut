define(['tantaman/web/widgets/Tablets',
		'../model/ThemeProviderCollection'],
function(Tablets, ThemeProviderCollection) {
	function EditorTablets(editorModel) {
		this._providers = new ThemeProviderCollection(editorModel, {overflow: true});
		this._providers.on('change:activeProviders', this._providersChanged, this);

		this._tablets = new Tablets({template: JST['strut.slide_editor/Tablets']});
		this.$el = this._tablets.$el;

		this._providersChanged();
	}

	EditorTablets.prototype = {
		dispose: function() {
			this._tablets.dispose();
			this._providers.dispose();
		},

		_providersChanged: function() {
			var views = [];
			this._providers.activeProviders().forEach(function(provider) {
				views.push(provider.view());
			}, this);
			this._tablets.hide();
			this._tablets.empty();
			this._tablets.add(views);
		},

		render: function() {
			this._tablets.render();
			return this;
		}
	};

	return EditorTablets;
});