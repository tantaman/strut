define(['lang', 'libs/backbone',
		'strut/themes/AvailableBackgrounds'],
function(lang, Backbone, AvailableBackgrounds) {
	function ContextMenu() {

	}

	_.extend(ContextMenu.prototype, Backbone.Events);

	var menu = new ContextMenu();

	var menuItems = {
		background: {
			name: "Background",
			icon: "tint",
			items: {}
		}
	};

	var backgroundItems = menuItems.background.items;
	AvailableBackgrounds.backgrounds.forEach(function(bg, i) {
		backgroundItems["bg" + i] = {
			name: '',
			background: bg.klass
		};
	});

	$.contextMenu({
		selector: '.slideContainer', 
		callback: function(key, options) {
			menu.trigger('change:' + key, menu, key, options);
		},
		items: menuItems
	});

	$('.context-menu-item[class*="solid-bg-"]').hover(function() {
	}, function() {
	});

	return menu;
});
