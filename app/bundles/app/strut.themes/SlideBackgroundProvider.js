define(['./AvailableBackgrounds', 'tantaman/web/widgets/HorizontalDropdown'],
function(Backgrounds, View) {
	function SlideBackgroundProvider(editorModel) {
		this._view = new View(Backgrounds, JST['strut.themes/BackgroundChooserDropdown']);
		this._editorModel = editorModel;

		// Bind to selection events fired from view
	}

	SlideBackgroundProvider.prototype = {
		view: function() {
			return this._view;
		},

		dispose: function() {
			
		}
	};

	return SlideBackgroundProvider;
});