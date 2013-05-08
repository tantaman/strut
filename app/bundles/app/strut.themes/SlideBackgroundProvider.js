define(['./AvailableBackgrounds', 'tantaman/web/widgets/Dropdown'],
function(Backgrounds, View) {
	function SlideBackgroundProvider(editorModel) {
		this._view = new View(Backgrounds, JST['strut.themes/BackgroundChooserDropdown']);
		this._editorModel = editorModel;

		this._view.on('over', this._previewBackground, this);
		this._view.on('out', this._restoreBackground, this);
		this._view.on('selected', this._setBackground, this);
		// Bind to selection events fired from view
	}

	SlideBackgroundProvider.prototype = {
		view: function() {
			return this._view;
		},

		_previewBackground: function(e) {
			var $slideContainer = $('.slideContainer');
			this._swapBg($slideContainer, e.currentTarget.dataset['class']);
		},

		_setBackground: function(e) {
			this._editorModel.deck().set('background', e.currentTarget.dataset['class'] || 'defaultbg')
		},

		_restoreBackground: function(e) {
			var bg = this._editorModel.deck().get('background');
			var $slideContainer = $('.slideContainer');
			this._swapBg($slideContainer, bg || 'defaultbg');
		},

		_swapBg: function($el, newBg) {
			$el.removeClass($el.data('background'));
			$el.addClass(newBg);
			$el.data('background', newBg);
		},

		dispose: function() {
			this._view.dispose();	
		}
	};

	return SlideBackgroundProvider;
});