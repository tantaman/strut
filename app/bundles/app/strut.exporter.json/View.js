define(['libs/backbone', 'common/FileUtils', 'lang'],
function(Backbone, FileUtils, lang) {
	'use strict';

	return Backbone.View.extend({
		initialize: function() {
			this.name = 'JSON';
			this._rendered = false;
			/*
			TODO: handle browsers that can't do the download attribute.  Safari?
			*/
			this._dlSupported = 'download' in document.createElement('a')

			this.$el.html('<div class="alert">' + lang.strut_exporter_json.explain + '</div>');
			if (this._dlSupported) {
				this.$el.append('<div class="alert alert-success">' + lang.strut_exporter_json.click_below + '</div>');
			}
		},

		show: function($container, $modal) {
			this._$modal = $modal;
			var $ok = this._$modal.find('.ok');
			if (this._dlSupported) {
				this._makeDownloadable($ok);
			} else {
				this._populateTextArea();
			}

			$ok.html('<i class="icon-download-alt icon-white"></i>');
			$container.append(this.$el);
		},

		_makeDownloadable: function($ok) {
			var attrs = FileUtils.createDownloadAttrs('application\/json',
				JSON.stringify(this._exportable.export(), null, 2),
				this._exportable.identifier() + '.json');

			var a = $ok[0];
			a.download = attrs.download
			a.href = attrs.href
			a.dataset.downloadurl = attrs.downloadurl
		},

		_populateTextArea: function() {
			var $txt = this.$el.find('textarea');
			if ($txt.length == 0) {
				$txt = $('<textarea></textarea>');
				this.$el.append($txt);
			}

			$txt.val(JSON.stringify(this._exportable.export()));
		},

		hide: function() {
			this.$el.detach();
			this.hidden();
		},

		hidden: function() {
			// clean up the download link / text area
			if (this._dlSupported) {
				var $ok = this._$modal.find('.ok');
				window.URL.revokeObjectURL($ok.attr('href'));
			} else {
				this.$el.find('textarea').val('');
			}
		},

		render: function() {
			// anything really to render?
		},

		constructor: function JsonExportView(exportable) {
			this._exportable = exportable;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});