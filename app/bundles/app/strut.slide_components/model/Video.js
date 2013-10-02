define(['strut/deck/Component',
	'common/FileUtils'],
	function(Component, FileUtils) {
		'use strict';

		var matchers = [
			{
				type: 'youtube',
				reg: /youtube\.com\/.*v=(.*?)(&|$)/,
				srcType: function() {
					return 'yt';
				}
			},
			{
				type: 'html5',
				reg: /(.*)/,
				srcType: function(src) {
					return FileUtils.type(FileUtils.extension(src));
				}
			}
		];

		/**
		 * @class Video
		 * @augments Component
		 */
		return Component.extend({
			initialize: function() {
				var matcher, regResult, _i, _len;
				Component.prototype.initialize.apply(this, arguments);
				this.set("type", "Video");
				for (_i = 0, _len = matchers.length; _i < _len; _i++) {
					matcher = matchers[_i];
					regResult = matcher.reg.exec(this.get('src'));
					if (regResult != null) {
						this.set('shortSrc', regResult[1]);
						this.set('videoType', matcher.type);
						this.set('srcType', matcher.srcType(regResult[1]));
						break;
					}
				}
				return this;
			},
			constructor: function Video(attrs) {
				Component.prototype.constructor.call(this, attrs);
			}
		});
	});