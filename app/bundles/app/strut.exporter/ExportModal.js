define(['tantaman/web/widgets/TabbedModal'],
function(TabbedModal) {
	return TabbedModal.extend({
		intialize: function() {
		},

		__providerSelected: function(provider, e) {
			TabbedModal.prototype.__providerSelected.apply(this, arguments);
			// override the ok button with the
			// provider's button
		},

		constructor: function ExportModal(editorModel, exporterServices) {
			var tabs = [];
			exporterServices.forEach(function(exporter) {
				tabs.push(exporter.createView(editorModel.exportable));
			});
			TabbedModal.prototype.constructor.call(this, tabs);
		}
	});
});