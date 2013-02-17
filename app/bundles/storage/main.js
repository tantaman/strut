define(['./view/OpenModal',
		'./view/SaveAsModal',
		'./view/SaveMenuItem',
		'./model/StorageProvidersWrapper'],
function(OpenModal, SaveAsModal, SaveMenuItem, StorageProvidersWrapper) {
	'use strict';
	var storageProvidersWrapper = null;

	function MenuItem(title, modal) {
		this.$el = $('<span>' + title + '</span>');
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
			logger('Creating storage menu items');
			var menuItems = [];

			
			if (openModal == null) {
				openModal = new OpenModal({
					editorModel: editorModel,
					storageProviders: storageProvidersWrapper
				});
				openModal.render();
				$modals.append(openModal.$el);
			}

			if (saveAsModal == null) {
				saveAsModal = new SaveAsModal({
					editorModel: editorModel,
					storageProviders: storageProvidersWrapper
				});
				saveAsModal.render();
				$modals.append(saveAsModal.$el);
			}

			menuItems.push(new MenuItem('Open', openModal));

			menuItems.push(new SaveMenuItem(saveAsModal, editorModel));
			menuItems.push(new MenuItem('Save As...', saveAsModal));

			return menuItems;
		}
	};

	return {
		initialize: function(registry) {
			storageProvidersWrapper = new StorageProvidersWrapper(registry);
			registry.register({
				interfaces: 'strut.LogoMenuItemProvider'
			}, service);
		}
	}
});