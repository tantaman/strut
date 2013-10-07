define(['./ComponentView', './Mixers'],
function(ComponentView, Mixers) {
	'use strict';

	return ComponentView.extend({
		className: 'component shapeView',

		initialize: function() {
			ComponentView.prototype.initialize.apply(this, arguments);
			this.scale = Mixers.scaleObjectEmbed;
			this.model.off('change:scale', this._setUpdatedTransform, this);
			this.model.on('change:scale', Mixers.scaleChangeInlineSvg, this);
		},

		// TODO: update markup on model so fills get preserved?
		// Or maintain outer node here?
		render: function() {
			ComponentView.prototype.render.call(this);
			var obj = this.model.get('markup')
			this.$object = $(obj);

			var scale = this.model.get('scale');

			var $content = this.$el.find('.content');
			$content.append(this.$object);
			$content.append($('<div class="overlay"></div>'));

			if (scale && scale.width) {
				this.$object.attr(scale);
			} else {
				scale = {
					width: 100,
					height: 100
				};
				this.model.attributes.scale = scale;
				this.$object.attr(scale);
			}

			return this.$el;
		}
	});
});