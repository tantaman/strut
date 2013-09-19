define(['tantaman/web/widgets/Dropdown',
		'strut/deck/Utils'],
function(View, DeckUtils) {
	function BackgroundProvider(backgrounds, editorModel, selector, attr, classes) {
		this._view = new View(backgrounds, JST['strut.themes/BackgroundChooserDropdown'],
			{class: 'iconBtns group-dropdown'});
		this._editorModel = editorModel;
		this._selector = selector;
		this._attr = attr;

		this._previewBackground = this._previewBackground.bind(this);
		this._restoreBackground = this._restoreBackground.bind(this);
		this._setBackground = this._setBackground.bind(this);
		this._view.$el.on('mouseover', '.thumbnail', this._previewBackground);
		this._view.$el.on('mouseout', '.thumbnail', this._restoreBackground);
		this._view.$el.on('click', '.thumbnail', this._setBackground);

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
	
			var obj;
			if ($(e.currentTarget).parent().parent().is('.allSlides')) {
				obj = this._editorModel.deck();
			} else {
				obj = this._editorModel.activeSlide();
			}

			var bg = e.currentTarget.dataset['class'];
			if (bg == '')
				bg = undefined;
			else
				bg = 'defaultbg';

			obj.set(attr, bg);
		},

		_restoreBackground: function(e) {
			// ugh...
			var bg;
			if (this._attr == 'Background')
				bg = DeckUtils.slideBackground(this._editorModel.activeSlide(),
					this._editorModel.deck());
			bg = bg || this._editorModel.deck()['slide' + this._attr]();
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