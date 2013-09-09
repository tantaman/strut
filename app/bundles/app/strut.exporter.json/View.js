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
			this._dlSupported = window.dlSupported;

			this.$el.html('<div class="alert alert-info">' + lang.strut_exporter_json.explain + '</div>');
			if (this._dlSupported) {
				this.$el.append('<div class="alert alert-success">' + lang.strut_exporter_json.click_below + '</div>');
			}
		},

		show: function($container, $modal) {
			this._$modal = $modal;
			var $ok = this._$modal.find('.ok');
			if (this._dlSupported) {
				$ok.html('<i class="icon-download-alt icon-white"></i>');
				this._makeDownloadable($ok);
			} else {
				$ok.html('');
				if (window.hasFlash)
					this._populateDownloadify();
				else
					this._populateTextArea();
			}

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
				$txt = $('<textarea style="width: 500px; height: 200px;"></textarea>');
				this.$el.append($txt);
			}

			$txt.val(JSON.stringify(this._exportable.export()));
		},

		_populateDownloadify: function() {
			var $dlify = this.$el.find('#downloadify');
			if ($dlify.length == 0) {
				$dlify = $('<p id="downloadify"></p>');
				this.$el.append($dlify);
				console.log('Puplating downloadify');
				var self = this;
				setTimeout(function() {
					Downloadify.create($dlify[0], {
					    filename: function(){
					      return self._exportable.identifier() + '.json';
					    },
					    data: function(){ 
					      return JSON.stringify(self._exportable.export(), null, 2);
					    },
					    onComplete: function(){ 
					       
					    },
					    onCancel: function(){ 
					      
					    },
					    onError: function(){ 
					      alert('Error exporting'); 
					    },
					    swf: 'preview_export/download_assist/downloadify.swf',
					    downloadImage: 'preview_export/download_assist/download.png',
					    width: 100,
					    height: 30,
					    transparent: false,
					    append: false
					  });
				}, 0);
			}
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