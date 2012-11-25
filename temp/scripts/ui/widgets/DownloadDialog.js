
/*
@author Matt Crinklaw-Vot
*/


(function() {

  define(["backbone", 'common/FileUtils'], function(Backbone, FileUtils) {
    return Backbone.View.extend({
      className: "downloadDialog modal",
      events: {
        "click .ok": "okClicked",
        "hidden": "hidden"
      },
      initialize: function() {},
      show: function(val, name) {
        if (val != null) {
          this._val = val;
          this._makeDownloadable(name);
        }
        return this.$el.modal("show");
      },
      /**
      		Makes a download link for _val
      		*
      */

      _makeDownloadable: function(name) {
        /*
        			MIME_TYPE = 'application\/json'
        			blob = new Blob(@_val, type: MIME_TYPE)
        			a = @$download[0]
        			a.download = 'presentation.json' # needs a real name
        			a.href = window.URL.createObjectURL(blob)
        			a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':')
        */

        var a, attrs;
        attrs = FileUtils.createDownloadAttrs('application\/json', this._val, name + '.json');
        a = this.$download[0];
        a.download = attrs.download;
        a.href = attrs.href;
        return a.dataset.downloadurl = attrs.downloadurl;
      },
      okClicked: function() {
        return this.$el.modal("hide");
      },
      hidden: function() {
        this._val = '';
        return this._cleanUpDownloadLink();
      },
      _cleanUpDownloadLink: function() {
        if (this.$download != null) {
          return window.URL.revokeObjectURL(this.$download.attr('href'));
        }
      },
      render: function() {
        this.$el.html(JST["widgets/DownloadDialog"]());
        this.$el.modal();
        this.$el.modal("hide");
        this.$download = this.$el.find('.downloadLink');
        return this.$el;
      }
    });
  });

}).call(this);
