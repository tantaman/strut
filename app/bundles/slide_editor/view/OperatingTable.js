define(['libs/backbone',
		'css!styles/slide_editor/operatingTable.css',
		'bundles/slide_components/ComponentFactory'],
function(Backbone, empty, ComponentFactory) {
	'use strict';
	return Backbone.View.extend({
		className: 'operatingTable',
		events: {
        	"click": "_clicked",
        	"focused": "_focus",
        	"dragover": "_dragover",
        	"drop": "_drop"
      	},

		initialize: function() {
			this._resize = this._resize.bind(this);
			$(window).resize(this._resize);

			// Re-render when active slide changes in the deck
			this._deck.on('change:activeSlide', this.setModel, this);
		},

		render: function() {
			this._$slideContainer = $('<div class="slideContainer"></div>')
			this.$el.html(this._$slideContainer);
			this._$slideContainer.css(config.slide.size);

			var self = this;
			setTimeout(function() {
				this._rendered = true;
				self._resize();
				self._renderContents();
			});

			return this;
		},

		_clicked: function() {

		},

		_focus: function() {

		},

		_dragover: function() {

		},

		_drop: function() {

		},

		setModel: function(model) {
			var prevModel = this.model;
			if (this.model === model) return;

			if (this.model != null) {
				this.model.off(null, null, this);
			}
			this.model = slide;
			if (this.model != null) {
				this.model.on('change:components.add', this._componentAdded, this);
			}
			this._renderContents(prevModel);
			return this;
		},

		dispose: function() {
			$(window).off(this._resize);
		},

		_renderContents: function(prevModel) {
			if (prevModel != null) {
				prevModel.trigger('unrender', true);
			}

			if (!this._rendered) return;

			if (this.model != null) {
				var components = this.model.get('components');
				components.forEach(function(comp) {
					var view = ComponentFactory.createView(comp);
					this.$slideContainer.append(view.render());
				}, this);
			}
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

		constructor: function OperatingTable(deck, registry) {
			this._deck = deck;
			this._registry = registry;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});