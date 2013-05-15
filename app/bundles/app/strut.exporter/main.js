define(['tantaman/web/widgets/MenuItem',
		'framework/ServiceCollection',
		'./ExportImportModal',
		'lang'],
function(MenuItem, ServiceCollection, ExportModal, lang) {
	'use strict';

	var $modals = $('#modals');

	var exportModal = null;
	var exporterCollection = null;
	var menuProvider = {
		createMenuItems: function(editorModel) {
			if (exportModal == null) {
				exportModal = new ExportModal(editorModel, exporterCollection);
				exportModal.render();
				$modals.append(exportModal.$el);
			}

			var menuItem = new MenuItem({ title: lang.export, modal: exportModal});

			return [menuItem];
		}
	};

	return {
		initialize: function(registry) {
			exporterCollection = new ServiceCollection(
											registry, 'strut.exporter',
											ServiceCollection.toServiceConverter
										);

			registry.register({
				// again, shouldn't call out LogoMenuItemProvider explicitly
				interfaces: ['strut.LogoMenuItemProvider']
			}, menuProvider);

			registry.register({
				interfaces: 'strut.exporter.Collection'
			}, exporterCollection);
		}
	};
});