define(["./ComponentView", './Mixers'],
	function(ComponentView, Mixers) {
		var Html5, Youtube, result, types;

		/**
		 * @class VideoView.Html5
		 * @augments ComponentView
		 */
		Html5 = ComponentView.extend({
			className: "component videoView",

			/**
			 * Initialize VideoView.Html5 component view.
			 */
			initialize: function() {
				return ComponentView.prototype.initialize.apply(this, arguments);
			},

			/**
			 * Render element based on component model.
			 *
			 * @returns {*}
			 */
			render: function() {
				var $video,
					_this = this;
				ComponentView.prototype.render.call(this);
				$video = $("<video controls></video>");
				$video.append("<source preload='metadata' src='" + (this.model.get("src")) + "' type='" + (this.model.get("srcType")) + "' />");
				$video.bind("loadedmetadata", function() {
					_this._finishRender($(this));
				});
				this.$el.find(".content").append($video);
				return this.$el;
			},

			/**
			 * Do the actual rendering once video is loaded.
			 *
			 * @param {jQuery} $img
			 * @returns {*}
			 * @private
			 */
			_finishRender: function($video) {
				this.origSize = {
					width: $video[0].videoWidth,
					height: $video[0].videoHeight
				};
				this._setUpdatedTransform();
			}
		});

		/**
		 * @class VideoView.Youtube
		 * @augments ComponentView
		 */
		Youtube = ComponentView.extend({
			className: 'component videoView',

			/**
			 * Initialize VideoView.Youtube component view.
			 */
			initialize: function() {
				ComponentView.prototype.initialize.apply(this, arguments);
				this.scale = Mixers.scaleObjectEmbed;
				this.model.off("change:scale", this._setUpdatedTransform, this);
				this.model.on("change:scale", Mixers.scaleChangeObjectEmbed, this);
			},

			/**
			 * Render element based on component model.
			 *
			 * @returns {*}
			 */
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
				} else {
					this.model.attributes.scale = {
						width: 425,
						height: 344
					};
				}
				this.$el.find('.content').append(this.$object);
				return this.$el;
			}
		});

		types = {
			html5: Html5,
			youtube: Youtube
		};
		return function(params) {
			return new types[params.model.get('videoType')](params);
		};
	});