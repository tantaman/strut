define(['./view/OpenModal',
		'./view/SaveAsModal',
		'./view/SaveMenuItem',
		'./model/StorageInterface',
		'lang'],
function(OpenModal,
		SaveAsModal,
		SaveMenuItem,
		StorageInterface,
		lang) {
	'use strict';
	var storageInterface = null;

	function MenuItem(title, modal) {
		this.$el = $('<li><a>' + title + '</a></li>');
		this.$el.click(function() {
			modal.show();
		});
	}

	MenuItem.prototype = {
		render: function() {
			this.$el.html();
			return this;
		}
	};

	var openModal = null;
	var saveAsModal = null;
	var $modals = $('#modals');
	
	var service = {
		createMenuItems: function(editorModel) {
			log('Creating storage menu items');
			var menuItems = [];

			
			if (openModal == null) {
				openModal = new OpenModal({
					editorModel: editorModel,
					storageInterface: storageInterface
				});
				openModal.render();
				$modals.append(openModal.$el);
			}

			if (saveAsModal == null) {
				saveAsModal = new SaveAsModal({
					editorModel: editorModel,
					storageInterface: storageInterface
				});
				saveAsModal.render();
				$modals.append(saveAsModal.$el);
			}

			menuItems.push(new MenuItem(lang.open, openModal));

			menuItems.push(new SaveMenuItem(saveAsModal, editorModel, storageInterface));
			menuItems.push(new MenuItem(lang.save_as, saveAsModal));

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
