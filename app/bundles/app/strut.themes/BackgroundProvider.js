define(['tantaman/web/widgets/Dropdown'],
function(View) {
	function BackgroundProvider(backgrounds, editorModel, selector, attr, classes) {
		this._view = new View(backgrounds, JST['strut.themes/BackgroundChooserDropdown'], {class: 'group-dropdown'});
		this._editorModel = editorModel;
		this._selector = selector;
		this._attr = attr;

		this._view.on('over', this._previewBackground, this);
		this._view.on('out', this._restoreBackground, this);
		this._view.on('selected', this._setBackground, this);

		this._classes = classes;
	}

	BackgroundProvider.prototype = {
		view: function() {
			return this._view;
		},

		_previewBackground: function(e) {
			var $container = $(this._selector);
			var klass = e.currentTarget.dataset['class'];
			if (klass == 'defaultbg') {
				if (this._attr == 'Background')
					klass = this._editorModel.deck().slideSurface();
			}
			this._swapBg($container, klass);
		},

		_setBackground: function(e) {
			var attr = this._attr.substring(0,1).toLowerCase() + this._attr.substring(1);
			this._editorModel.deck().set(attr, e.currentTarget.dataset['class'] || 'defaultbg')
		},

		_restoreBackground: function(e) {
			var bg = this._editorModel.deck()['slide' + this._attr]();
			var $container = $(this._selector);
			this._swapBg($container, bg);
		},

		_swapBg: function($el, newBg) {
			$el.removeClass();
			$el.addClass(this._classes + ' ' + newBg);
		},

		dispose: function() {
			this._view.dispose();	
		}
	};

	return BackgroundProvider;
});