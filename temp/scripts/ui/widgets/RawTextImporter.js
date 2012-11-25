
/*
@author Matt Crinklaw-Vogt
*/


(function() {

  define(["backbone"], function(Backbone) {
    return Backbone.View.extend({
      className: "rawTextImporter modal",
      events: {
        "click .ok": "okClicked",
        "hidden": "hidden"
      },
      initialize: function() {},
      show: function(cb, val) {
        this.cb = cb;
        if (val != null) {
          this.$txtArea.val(val);
        }
        return this.$el.modal("show");
      },
      /**
      		Makes the text contained in the textarea
      		downloadable.
      		*
      */

      makeDownloadable: function() {
        var MIME_TYPE, a, blob;
        MIME_TYPE = 'application\/json';
        blob = new Blob([this.$txtArea.val()], {
          type: MIME_TYPE
        });
        a = $('<a class="downloadLink btn btn-inverse" target="_blank" title="Download"><i class="icon-download-alt icon-white"></i></a>')[0];
        a.download = 'presentation.json';
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');
        return this.$el.find('.modal-footer').prepend(a);
      },
      okClicked: function() {
        if (this.cb != null) {
          this.cb(this.$txtArea.val());
        }
        return this.$el.modal("hide");
      },
      hidden: function() {
        if (this.$txtArea != null) {
          this.$txtArea.val("");
        }
        return this._cleanUpDownloadLink();
      },
      _cleanUpDownloadLink: function() {
        var $prevLink;
        $prevLink = this.$el.find('.downloadLink');
        if ($prevLink.length !== 0) {
          console.log('Removing prev link');
          window.URL.revokeObjectURL($prevLink.attr('href'));
          return $prevLink.remove();
        }
      },
      render: function() {
        this.$el.html(JST["widgets/RawTextImporter"]());
        this.$el.modal();
        this.$el.modal("hide");
        this.$txtArea = this.$el.find("textarea");
        return this.$el;
      }
    });
  });

}).call(this);
