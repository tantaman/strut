define(['bundles/deck/Component',
		'common/FileUtils'],
function(Component, FileUtils) {
	'use strict';
	var Video = Component.extend({
		initialize: function() {
			Component.prototype.initialize.apply(this, arguments);
			this.set('type', 'Video');

			for (matcher in matchers) {
				var regResult = matcher.reg.exec(this.get('src'));
				if (regResult) {
					this._handleMatch(regResult, matcher);
					break;
				}
			}
		},

		_handleMatch: function(regResult, matcher) {
			this.set('shortSrc', regResult[1]);
			this.set('videoType', matcher.type);
			this.set('srcType', matcher.srcType(regResult[1]));
		},

		constructor: function Video() {
			Component.prototype.constructor.apply(this, arguments);
		}
	});


	var matchers = [
	{
		type: 'youtube',
		reg: /youtube\.com\/.*v=(.*?)(&|$)/,
		srcType: function () { return 'yt'; }
	},
	{
		type: 'html5',
		reg: /(.*)/,
		srcType: (src) -> FileUtils.type(FileUtils.extension(src))
	}
	];

	return video;
});