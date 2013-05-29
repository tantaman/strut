define(['libs/backbone', './Archiver', 'lang'],
function(Backbone, Archiver, lang) {
	return Backbone.View.extend({
		name: "Zip",
		initialize: function() {
			this.$el.html(
				'<div class="alert alert-info">This renders and zips up your final presentation.</div>' +
				'<div class="alert alert-info"><strong>Note:</strong> The most effective way to archive your rendered presentation (<strong>and include all assets</strong>) is to:<br/>' +
				'<ol><li>Click <code>Preview</code></li><li>Use your browser\'s <code>Save Page As (Ctrl+S / ⌘+S)</code> functionality<br/>to save the entire presentation to disk.</li></ol>' +
				'</div><div class="alert alert-success">Click below to continue downloading the generated zip</div>');
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
			this.$el.html('Zipping while running Strut from file:// URLs is currently not supported due to browser security restrictions.  The best way zip your presentation in this case is to:<br/>'
				+ '<ol><li>Click Preview, then</li><li>Use your browser\'s <code>Save Page As</code> functionality<br/>to save the entire presentation to disk.</li></ol>');
			return this;
		},

		constructor: function ZipExportView(exportable) {
			this._exportable = exportable;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});