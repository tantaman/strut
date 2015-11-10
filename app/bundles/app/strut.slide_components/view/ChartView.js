define(["./ComponentView", './Mixers', , 'css!styles/chart/chartView.css'],
	function(ComponentView, Mixers) {

		/**
		 * @class ChartView
		 * @augments ComponentView
		 */
		return ComponentView.extend({
			className: "component chartView",
			tagName: "div",

			/**
			 * Initialize Chart component view.
			 */
			initialize: function() {
				ComponentView.prototype.initialize.apply(this, arguments);
			},

			/**
			 * Render element based on component model.
			 *
			 * @returns {*}
			 */
			render: function() {
				var _this = this;
				ComponentView.prototype.render.call(this);
                                var chart = this.model.get('src');
                                var $iframe
                                $iframe = $('<iframe src="' + chart.url + '"></iframe>');
                                $iframe.data('chart', chart);
                                this.$content.append($iframe);
                                this.$content.find("iframe").load(function () {
                                    return _this._finishRender($(this));
                                });
                                $iframe.error(function () {
                                    return _this.remove();
                                });
				return this.$el;
			},

			/**
			 * Do the actual rendering once Chart is loaded.
			 *
			 * @param {jQuery} $img
			 * @returns {*}
			 * @private
			 */
			_finishRender: function($iframe) {
                                this.origSize = {
						width: $iframe.data("chart").width,
						height: $iframe.data("chart").height
				};
			        $iframe[0].width = $iframe.data("chart").width;
                                $iframe[0].height = $iframe.data("chart").height;
                                this._setUpdatedTransform();
				
				$iframe.bind("dragstart", function(e) {
					e.preventDefault();
					return false;
				});
			}
		});
	});