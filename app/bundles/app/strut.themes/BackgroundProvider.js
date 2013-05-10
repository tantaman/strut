define(['tantaman/web/widgets/Dropdown'],
function(View) {
	function BackgroundProvider(backgrounds, editorModel, selector, attr) {
		this._view = new View(backgrounds, JST['strut.themes/BackgroundChooserDropdown']);
		this._editorModel = editorModel;
		this._selector = selector;
		this._attr = attr;

		this._view.on('over', this._previewBackground, this);
		this._view.on('out', this._restoreBackground, this);
		this._view.on('selected', this._setBackground, this);
	}

	BackgroundProvider.prototype = {
		view: function() {
			return this._view;
		},

		_previewBackground: function(e) {
			var $container = $(this._selector);
			this._swapBg($container, e.currentTarget.dataset['class']);
		},

		_setBackground: function(e) {
			this._editorModel.deck().set(this._attr, e.currentTarget.dataset['class'] || 'defaultbg')
		},

		_restoreBackground: function(e) {
			var bg = this._editorModel.deck().get(this._attr);
			var $container = $(this._selector);
			this._swapBg($container, bg || 'defaultbg');
		},

		_swapBg: function($el, newBg) {
			$el.removeClass($el.data(this._attr));
			$el.addClass(newBg);
			$el.data(this._attr, newBg);
		},

		dispose: function() {
			this._view.dispose();	
		}
	};

	return BackgroundProvider;
});