define(['libs/backbone', './Archiver', 'lang'],
function(Backbone, Archiver, lang) {
	return Backbone.View.extend({
		name: "Zip",
		initialize: function() {
			this.$el.html('<div class="alert alert-success">' + lang.strut_exporter_json.click_below + '</div>');
		},

		show: function($container, $modal) {
			this._$modal = $modal;
			var $ok = this._$modal.find('.ok');
			this._makeDownloadable($ok);

			$ok.html('<i class="icon-download-alt icon-white"></i>');
			$container.append(this.$el);
		},

		_makeDownloadable: function($ok) {
			// TODO: shouldn't be reaching into adapted.
			// This'll require a re-work of the impress renderer to break
			// the dependencies.
			var archiver = new Archiver(this._exportable.adapted.deck());
			var self = this;
			archiver.createSimple(function(data) {
				var a = $ok[0];
				a.href = window.URL.createObjectURL(data);
				a.download = self._exportable.identifier() + '.zip';
				a.dataset.downloadurl = ['application/json', a.download, a.href].join(':');
			}, {type: 'blob'});
		},

		hide: function() {
			this.$el.detach();
			this.hidden();
		},

		hidden: function() {
			var $ok = this._$modal.find('.ok');
			window.URL.revokeObjectURL($ok.attr('href'));
		},

		render: function() {
			this.$el.html('Still in progress.  The best way to do this at the moment is to:<br/>'
				+ '<ol><li>Click Preview, then</li><li>Use your browser\'s <code>Save Page As</code> functionality<br/>to save the entire presentation to disk.</li></ol>');
			return this;
		},

		constructor: function ZipExportView(exportable) {
			this._exportable = exportable;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});