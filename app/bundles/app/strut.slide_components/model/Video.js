define(['strut/deck/Component',
		'common/FileUtils'],
function(Component, FileUtils) {
	'use strict';
	var Video, matchers;
    Video = Component.extend({
      initialize: function() {
        var matcher, regResult, _i, _len;
        Component.prototype.initialize.apply(this, arguments);
        this.set("type", "Video");
        for (_i = 0, _len = matchers.length; _i < _len; _i++) {
          matcher = matchers[_i];
          regResult = matcher.reg.exec(this.get('src'));
          if (regResult != null) {
            this._handleMatch(regResult, matcher);
            break;
          }
        }
        return this;
      },
      _handleMatch: function(regResult, matcher) {
        this.set('shortSrc', regResult[1]);
        this.set('videoType', matcher.type);
        return this.set('srcType', matcher.srcType(regResult[1]));
      },
      constructor: function Video() {
			Component.prototype.constructor.apply(this, arguments);
		}
    });
    matchers = [
      {
        type: 'youtube',
        reg: /youtube\.com\/.*v=(.*?)(&|$)/,
        srcType: function() {
          return 'yt';
        }
      }, {
        type: 'html5',
        reg: /(.*)/,
        srcType: function(src) {
          return FileUtils.type(FileUtils.extension(src));
        }
      }
    ];
    return Video;
});