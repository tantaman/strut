/*
SlideBackgroundProvider {
view() {
	return {
		renders a button that allows bg selection and what not
	}
}
}

model?


registry.register({
	interfaces: 'strut.ThemeProvider',
	meta: {
		modes: {
			slideEditor: true
		}
	}
}, backgroundProviderFactory);

backgroundProviderFactory = {
	create: function() {
		return new SlideBackgroundProvider();
	}
}


We need a horizontally scrolling dropdown...
*/
define(['./AvailableBackgrounds'],
function(Backgrounds) {
	function SlideBackgroundProvider(editorModel) {
		this._view = new SlideBgProviderView();
		this._editorModel = editorModel;
	}

	SlideBackgroundProvider.prototype = {
		view: function() {
			return this._view;
		}
	};

	return SlideBackgroundProvider;
});