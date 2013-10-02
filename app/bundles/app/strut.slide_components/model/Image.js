define(['strut/deck/Component',
	'common/FileUtils'],
	function(Component, FileUtils) {
		'use strict';

		/**
		 * @class Image
		 * @augments Component
		 */
		return Component.extend({
			initialize: function() {
				Component.prototype.initialize.apply(this, arguments);
				this.set('type', 'Image');

				var src = this.get('src');
				this.set('imageType', FileUtils.imageType(src));
				this.on('change:src', this._updateCache, this);
				this._cachedImage = new Image();
				this._updateCache();
			},

			_updateCache: function() {
				this._cachedImage.src = this.get('src');
			},

			toBase64: function() {

			},

			constructor: function ImageModel(attrs) {
				Component.prototype.constructor.call(this, attrs);
			}
		});
	});