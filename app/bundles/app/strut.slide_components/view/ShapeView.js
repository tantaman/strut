define(['./ComponentView', './Mixers'],
function(ComponentView, Mixers) {
	'use strict';

	return ComponentView.extend({
		className: 'component shapeView',

		initialize: function() {
			ComponentView.prototype.initialize.apply(this, arguments);
			this.scale = Mixers.scaleObjectEmbed;
			this.model.off('change:scale', this._setUpdatedTransform, this);
			this.model.on('change:scale', Mixers.scaleChangeObject, this);
		},

		// TODO: make VideoView and ShapeView share a common ancestor,
		// "ObjectView"
		render: function() {
			ComponentView.prototype.render.call(this);
			var obj = '<object class="emb" data="' + this.model.get('src')
			+ '" width="100" height="100" type="image/svg+xml"></object>';
			this.$object = $(obj);

			var scale = this.model.get('scale');
			if (scale && scale.width) {
				this.$object.attr(scale);
			} else {
				this.model.attributes.scale = {
					width: 100,
					height: 100
				};
			}

			var $content = this.$el.find('.content');
			$content.append(this.$object);
			$content.append($('<div class="overlay"></div>'));
			return this.$el;
		}
	});
});