define(['./ComponentView', './Mixers',
	'tantaman/web/widgets/ManagedColorChooser'],
function(ComponentView, Mixers, ManagedColorChooser) {
	'use strict';

	var colorChooser = ManagedColorChooser.get('floatingChooser');

	return ComponentView.extend({
		className: 'component shapeView',

		initialize: function() {
			ComponentView.prototype.initialize.apply(this, arguments);
			this.scale = Mixers.scaleObjectEmbed;
			this.model.off('change:scale', this._setUpdatedTransform, this);
			this.model.on('change:scale', Mixers.scaleChangeInlineSvg, this);

			this.model.on('change:fill', this._fillChanged, this);
			this._updateFill = this._updateFill.bind(this);

			// var self = this;
			// this.$el.on('click', '.shape-color-picker', function() {
			// 	colorChooser.show({
			// 		left: self.model.get('x') + self.model.get('scale').width,
			// 		top: self.model.get('y') + 32,
			// 		move: self._updateFill,
			// 		appendTo: '.operatingTable > .slideContainer'
			// 	});
			// });
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

			this._$colorPreview = this.$el.find('.sp-preview-inner');
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

			var fill = this.model.get('fill');
			if (fill)
				this.$object.attr('fill', fill);

			return this.$el;
		},

		_xChanged: function(model, value) {
			ComponentView.prototype._xChanged.apply(this, arguments);
			colorChooser.move({left: value + this.model.get('scale').width});
		},

		_yChanged: function(model, value) {
			ComponentView.prototype._yChanged.apply(this, arguments);
			colorChooser.move({top: value - 5});
		},

		remove: function() {
			ComponentView.prototype.remove.apply(this, arguments);
			colorChooser.hide({
				move: this._updateFill
			});
		},

		_selectionChanged: function(model, value) {
			if (!value) {
				colorChooser.hide({
					move: this._updateFill
				});
			} else {
				colorChooser.show({
					left: this.model.get('x') + this.model.get('scale').width,
					top: this.model.get('y') - 5,
					move: this._updateFill,
					appendTo: '.operatingTable > .slideContainer'
				});
			}

			ComponentView.prototype._selectionChanged.apply(this, arguments);
		},

		_fillChanged: function(model, color) {
			this._$colorPreview.css('background-color', color);
			this.$object.attr('fill', color);
		},

		_updateFill: function(color) {
			this.model.set('fill', color.toHexString());
		}
	});
});