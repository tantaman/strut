(function() {

  define(['backbone', 'common/FileUtils'], function(Backbone, FileUtils) {
    return Backbone.View.extend({
      className: 'dispNone',
      initialize: function(triggerElem, infoProvider) {
        this.infoProvider = infoProvider;
        if (triggerElem != null) {
          return triggerElem.on('click', this.trigger.bind(this));
        }
      },
      trigger: function(info) {
        var a, attrs, dlInfo;
        dlInfo = info || this.infoProvider();
        attrs = FileUtils.createDownloadAttrs(dlInfo.mimeType, dlInfo.value, dlInfo.name);
        a = this.$a[0];
        a.download = attrs.download;
        a.href = attrs.href;
        a.dataset.downloadurl = attrs.downloadurl;
        return this.$a.click();
      },
      cleanUpDownloadLink: function() {
        return window.URL.revokeObjectURL(this.$a.attr('href'));
      },
      remove: function() {
        return cleanUpDownloadLink();
      },
      render: function() {
        this.$a = $('<a target="_blank"></a>');
        return this.$el.html(this.$a);
      }
    });
  });

}).call(this);
