define(['tantaman/web/widgets/TabbedModal'],
function(TabbedModal) {
	return TabbedModal.extend({
		intialize: function() {
		},

		constructor: function ExportModal(editorModel, services) {
			var tabs = [];
			services.forEach(function(service) {
				tabs.push(service.createView(editorModel));
			});
			TabbedModal.prototype.constructor.call(this, tabs);
		}
	});
});