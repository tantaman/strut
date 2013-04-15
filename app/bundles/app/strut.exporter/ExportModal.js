define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		intialize: function() {
			// need to look at available exporters and generate tabs...
			this._template = JST['strut.exporter/ExportModal']
		},

		show: function(nothing, title) {

		},

		render: function() {
			var exporterNames = _.map(this.exporters, function(exporter) {
				return exporter.name;
			});
			
			// this.$el.html(this._template({
			// 	tabs: exporterNames
			// }));
		},

		constructor: function ExportModal(editorModel, exporters) {
			this.editorModel = editorModel;
			this.exporters = exporters;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});