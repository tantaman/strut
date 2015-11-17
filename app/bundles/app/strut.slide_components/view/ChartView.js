define(["./ComponentView", './Mixers', 'css!styles/chart/chartView.css'],
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
		            return ComponentView.prototype.initialize.apply(this, arguments);
                        },

			/**
			 * Render element based on component model.
			 *
			 * @returns {*}
			 */
			render: function() {
                                var $frame, scale;
                                var src = this.model.get('src'), 
                                        h = Number(this.model.get('height')) + 30, 
                                        w = Number(this.model.get('width')) + 50;
				ComponentView.prototype.render.call(this);
				$frame = $("<iframe width='"+w+"' height='"+h+"' src='"+src+"'></iframe>");
				this.$el.find(".content").append($frame);
				this.$el.append('<div class="overlay"></div>');
				
                                var scale = {x: 1, y: 1, width: w, height: h};
				this.model.set("scale", scale);
                                this.$el.css({
					width: w ,
					height: h
				});
				return this.$el;
			}
		});
	});