
/*
@author Tantaman
*/


(function() {

  define(["./ComponentView", './Mixers'], function(ComponentView, Mixers) {
    var Html5, Youtube, result, types;
    Html5 = ComponentView.extend({
      className: "component videoView",
      initialize: function() {
        return ComponentView.prototype.initialize.apply(this, arguments);
      },
      _finishRender: function($video) {
        this.origSize = {
          width: $video[0].videoWidth,
          height: $video[0].videoHeight
        };
        return this._setUpdatedTransform();
      },
      render: function() {
        var $video,
          _this = this;
        ComponentView.prototype.render.call(this);
        $video = $("<video controls></video>");
        $video.append("<source preload='metadata' src='" + (this.model.get("src")) + "' type='" + (this.model.get("srcType")) + "' />");
        $video.bind("loadedmetadata", function() {
          return _this._finishRender($video);
        });
        this.$el.find(".content").append($video);
        return this.$el;
      }
    });
    Youtube = ComponentView.extend({
      className: 'component videoView',
      initialize: function() {
        ComponentView.prototype.initialize.apply(this, arguments);
        return this.scale = Mixers.scaleObjectEmbed;
      },
      render: function() {
        var object, scale;
        ComponentView.prototype.render.call(this);
        object = '<object width="425" height="344"><param name="movie" value="http://www.youtube.com/v/' + this.model.get('shortSrc') + '&hl=en&fs=1"><param name="allowFullScreen" value="true"><embed src="http://www.youtube.com/v/' + this.model.get('shortSrc') + '&hl=en&fs=1" type="application/x-shockwave-flash" allowfullscreen="true" width="425" height="344"></object>';
        this.$object = $(object);
        this.$embed = this.$object.find('embed');
        scale = this.model.get("scale");
        if (scale && scale.width) {
          this.$object.attr(scale);
          this.$embed.attr(scale);
        }
        this.$el.find('.content').append(this.$object);
        return this.$el;
      }
    });
    types = {
      html5: Html5,
      youtube: Youtube
    };
    return result = {
      create: function(params) {
        return new types[params.model.get('videoType')](params);
      }
    };
  });

}).call(this);
