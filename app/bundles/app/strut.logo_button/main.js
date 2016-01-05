define(['framework/ServiceCollection', 'tantaman/web/widgets/MenuItem',
		'tantaman/web/undo_support/CmdListFactory',
		'tantaman/web/widgets/UndoRedoMenuItem'],
function(ServiceCollection, MenuItem, CmdListFactory, UndoRedoMenuItem) {
	'use strict';

	var cmdList = CmdListFactory.managedInstance('editor');
	function createMenuItem(actionEntry) {
		if (actionEntry.meta().action == 'undo' || actionEntry.meta().action == 'redo') {
			return new UndoRedoMenuItem({
				cmdList: cmdList,
				action: actionEntry.meta().action,
				handler: actionEntry.service(),
				hotkey: actionEntry.meta().hotkey,
				title: actionEntry.meta().title
			});
		} else {
			return new MenuItem({
					title: actionEntry.meta().title,
					handler: actionEntry.service(),
					hotkey: actionEntry.meta().hotkey
				});
		}
	}

	var actionProviders;
	var actionButtonProvider = {
		// TODO: remove glob events and instead get it from the editor model...
		// shouldn't have any singletons anywhere.
		// TODO: the "ctrl + c", etc. bindings should be attached to the action?
		// instead of in our "glob evts" ?
		createMenuItems: function() {
			var menuItems = [];
			actionProviders.forEach(function(actionEntry) {
				menuItems.push(createMenuItem(actionEntry));
				// ugh what a hax0r :/
				if (actionEntry.meta().action == 'redo') {
					menuItems.push({
						$el: $('<li class="divider"></li>'),
						render: function() { return this; }
					});
				}
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