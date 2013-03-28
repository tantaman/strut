define(['./view/StorageModal',
		'./view/SaveMenuItem',
		'./model/StorageInterface',
		'./model/ActionHandlers',
		'lang'],
function(StorageModal,
		SaveMenuItem,
		StorageInterface,
		ActionHandlers,
		lang) {
	'use strict';
	var storageInterface = null;

	function MenuItem(title, modal, handler) {
		this.$el = $('<li><a>' + title + '</a></li>');
		this.$el.click(function() {
			modal.show(handler, title);
		});
	}

	MenuItem.prototype = {
		render: function() {
			this.$el.html();
			return this;
		}
	};

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

			menuItems.push(new MenuItem(lang.open, storageModal, ActionHandlers.open));

			menuItems.push(new SaveMenuItem(storageModal, editorModel, storageInterface));
			menuItems.push(new MenuItem(lang.save_as, storageModal, ActionHandlers.save));

			return menuItems;
		}
	};

	return {
		initialize: function(registry) {
			storageInterface = new StorageInterface(registry);
			registry.register({
				interfaces: 'strut.LogoMenuItemProvider'
			}, service);

			registry.register({
				interfaces: 'strut.StorageInterface'
			}, storageInterface)
		}
	}
});
