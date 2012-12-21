define(['libs/backbone',
		'css!styles/slide_editor/operatingTable.css'],
function(Backbone, SlideSnapshot, empty) {
	'use strict';
	return Backbone.View.extend({
		className: 'operatingTable',

		initialize: function() {
			this._resize = this._resize.bind(this);
			$(window).resize(this._resize);
		},

		render: function() {
			this._$slideContainer = $('<div class="slideContainer"></div>')
			this.$el.html(this._$slideContainer);
			this._$slideContainer.css(config.slide.size);

			var self = this;
			setTimeout(function() {
				self._resize();
			});

			return this;
		},

		_resize: function() {
			var width = this.$el.width();
			var height = this.$el.height();

			var slideSize = config.slide.size;

			var xScale = width / slideSize.width;
			var yScale = (height - 20) / slideSize.height;

			var newHeight = slideSize.height * xScale;
			if (newHeight > height) {
				var scale = yScale;
			} else {
				var scale = xScale;
			}

			var scaledWidth = scale * slideSize.width;

			var remainingWidth = width - scaledWidth;

			this._$slideContainer.css({
				'margin-left': remainingWidth / 2,
				'margin-right': remainingWidth / 2
			})

			this._$slideContainer.css(window.browserPrefix + 'transform', 'scale(' + scale + ')')
		},

		constructor: function OperatingTable() {
			Backbone.View.prototype.constructor.call(this);
		}
	});
});