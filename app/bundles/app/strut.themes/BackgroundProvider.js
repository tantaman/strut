define(['tantaman/web/widgets/Dropdown',
		'strut/deck/Utils',
		'tantaman/web/widgets/ItemImportModal',
		'lang'],
function(View, DeckUtils, ItemImportModal, lang) {
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

		this._setBackgroundImage = this._setBackgroundImage.bind(this);

		this._classes = classes;
	}

	var imageChooserModal = ItemImportModal.get({
		tag: 'img',
		name: lang.image,
		title: lang.insert_image,
		icon: 'icon-picture',
		browsable: true
	});
	// gradientChooserModal = ...
	// TODO: update your jQuery gradient chooser.

	BackgroundProvider.prototype = {
		view: function() {
			return this._view;
		},

		_previewBackground: function(e) {
			var $container = $(this._selector);
			var klass = e.currentTarget.dataset['class'];
			if (klass == null) return;
			if (klass == 'imgbg') return;

			if (klass == 'defaultbg') {
				if (this._attr == 'Background') {
					if ($(e.currentTarget).parent().parent().is('.allSlides')) {
						klass = this._editorModel.deck().slideSurface();
					} else {
						klass = DeckUtils.slideBackground(null, this._editorModel.deck(), {transparentForSurface: true, surfaceForDefault: true});
					}
				}
			}
			this._swapBg($container, klass);
		},

		_setBackground: function(e) {
			var bg = e.currentTarget.dataset['class'];
			var allSlides = $(e.currentTarget).parent().parent().is('.allSlides');
			if (bg == 'imgbg') {
				var self = this;
				imageChooserModal.show(function(src) {
					self._setBackgroundImage(allSlides, src);
				});
				// launch the modal to select an image
				// set the selected image url as the slide's background
				return;
			}

			if (bg == null)
				return;

			var attr = this._attr.substring(0,1).toLowerCase() + this._attr.substring(1);
			var obj = this._pickObj(allSlides);

			if (bg == '')
				bg = undefined;

			obj.set(attr, bg);
		},

		_pickObj: function(allSlides) {
			if (allSlides) {
				return this._editorModel.deck();
			} else {
				return this._editorModel.activeSlide();
			}
		},

		_setBackgroundImage: function(allSlides, src) {
			var obj = this._pickObj(allSlides);
			// TODO: we really have to fix this bastard.
			if (this._attr == 'Background') {
				obj.set('background', 'img:' + src);
			} else {
				obj.set('surface', 'img:' + src);
			}
		},

		_restoreBackground: function(e) {
			// ugh...
			var bg;
			if (this._attr == 'Background')
				bg = DeckUtils.slideBackground(this._editorModel.activeSlide(),
					this._editorModel.deck(), {transparentForSurface: true, surfaceForDefault: true});

			if (bg == null)
				bg = this._editorModel.deck()['slide' + this._attr]();
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