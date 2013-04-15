define(['./view/StorageModal',
		'./view/SaveMenuItem',
		'./model/StorageInterface',
		'./model/ActionHandlers',
		'tantaman/web/widgets/MenuItem',
		'lang'],
function(StorageModal,
		SaveMenuItem,
		StorageInterface,
		ActionHandlers,
		MenuItem,
		lang) {
	'use strict';
	var storageInterface = null;

	var storageModal = null;
	var $modals = $('#modals');
	
	var service = {
		createMenuItems: function(editorModel) {
			var menuItems = [];

			if (storageModal == null) {
				storageModal = new StorageModal({
					editorModel: editorModel,
					storageInterface: storageInterface
				});
				storageModal.render();
				$modals.append(storageModal.$el);
			}

			menuItems.push(new MenuItem(lang.new_, null, ActionHandlers.new_, editorModel));
			menuItems.push(new MenuItem(lang.open, storageModal, ActionHandlers.open));

			menuItems.push(new SaveMenuItem(storageModal, editorModel, storageInterface));
			menuItems.push(new MenuItem(lang.save_as, storageModal, ActionHandlers.save));

			menuItems.push({
				$el: $('<li class="divider"></li>'),
				render: function() { return this; }
			});

			return menuItems;
		}
	};

	return {
		// TODO: break strut dependencies!
		initialize: function(registry) {
			storageInterface = new StorageInterface(registry);
			registry.register({
				// TODO: shouldn't be logomenuitemprovider
				// should be brought into the logo
				// based on its capabilities
				interfaces: 'strut.LogoMenuItemProvider'
			}, service);

			registry.register({
				interfaces: 'strut.StorageInterface'
			}, storageInterface)
		}
	}
});
