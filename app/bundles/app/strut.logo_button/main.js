define(['framework/ServiceCollection', 'tantaman/web/widgets/MenuItem'],
function(ServiceCollection, MenuItem) {
	'use strict';

	var actionProviders;
	var actionButtonProvider = {
		// TODO: remove glob events and instead get it from the editor model...
		// shouldn't have any singletons anywhere.
		// TODO: the "ctrl + c", etc. bindings should be attached to the action?
		// instead of in our "glob evts" ?
		createMenuItems: function() {
			var menuItems = [];
			actionProviders.forEach(function(actionEntry) {
				menuItems.push(new MenuItem({
					title: actionEntry.meta().title,
					handler: actionEntry.service(),
					hotkey: actionEntry.meta().hotkey
				}));
			});
			menuItems.push({
				$el: $('<li class="divider"></li>'),
				render: function() { return this; }
			});
			return menuItems;
		}
	};

	return {
		initialize: function(registry) {
			actionProviders = new ServiceCollection(
					registry,
					'strut.editor.glob.action'
				);


			registry.register({
				interfaces: 'strut.LogoMenuItemProvider'
			}, actionButtonProvider);
		}
	}
});