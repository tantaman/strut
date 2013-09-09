define(['lang', 'libs/backbone',
		'strut/themes/AvailableBackgrounds'],
function(lang, Backbone, AvailableBackgrounds) {
	function ContextMenu() {
		this.on('change:background', this._backgroundChanged);
		this._previewBackground = this._previewBackground.bind(this);
		this._restoreBackground = this._restoreBackground.bind(this);
	}

	_.extend(ContextMenu.prototype, Backbone.Events);

	ContextMenu.prototype.setModel = function(model) {
		this.model = model;
	};

	ContextMenu.prototype._backgroundChanged = function(key, bg) {
		this.model.setBackground(bg);
	};

	ContextMenu.prototype._previewBackground = function(e) {
		this._preview = e.currentTarget.dataset.background;
		$slideContainer.removeClass(this.model.getBackground());
		$slideContainer.addClass(this._preview);
	};

	ContextMenu.prototype._restoreBackground = function() {
		$slideContainer.removeClass(this._preview);
		$slideContainer.addClass(this.model.getBackground());
	};

	var menu = new ContextMenu();

	var menuItems = {
		background: {
			name: "Single Slide Background",
			icon: "tint",
			items: {}
		}
	};

	var backgroundItems = menuItems.background.items;
	AvailableBackgrounds.backgrounds.forEach(function(bg, i) {
		backgroundItems["background:" + bg.klass] = {
			name: '',
			background: bg.klass
		};
	});

	backgroundItems["background:defaultbg"] = {
		name: 'Invisible',
		background: 'defaultbg'
	};

	backgroundItems["background:"] = {
		name: 'Reset',
		background: undefined
	};

	$.contextMenu({
		selector: '.slideContainer', 
		callback: function(key, options) {
			var parts = key.split(':');
			menu.trigger('change:' + parts[0], key, parts[1]);
		},
		events: {
			show: menuShown
		},
		items: menuItems
	});

	var $slideContainer = null;
	function menuShown() {
		$slideContainer = $('.slideContainer');
	}

	$('.context-menu-item[class*="solid-bg-"]').hover(
		menu._previewBackground,
		menu._restoreBackground);

	return menu;
});
