define(['libs/backbone',
		'./SlideDrawer',
		'css!styles/slide_snapshot/slideSnapshot.css',
		'strut/deck/Utils'],
function(Backbone, SlideDrawer, css, DeckUtils) {
	'use strict';

	return Backbone.View.extend({
		className: 'slideSnapshot',
		events: {
			'click': '_selected',
			'click .removeBtn': '_removeClicked',
			'mousedown .removeBtn': '_removePressed',
			destroyed: 'dispose'
		},

		initialize: function() {
			this.model.on('change:active', this._activated, this);
			this.model.on('dispose', this.dispose, this);
			this.model.on('change:background', this._bgChanged, this);
			this.options.deck.on('change:background', this._bgChanged, this);
			this.options.deck.on('change:surface', this._bgChanged, this);

			this._template = JST['strut.slide_snapshot/SlideSnapshot'];
		},

		_selected: function() {
			this.model.set('selected', true);
			this.model.set('active', true);
		},

		_removeClicked: function(e) {
			this.remove(true);
			e.stopPropagation();
		},

		_removePressed: function(e) {
			e.stopPropagation();
		},

		remove: function(removeModel) {
			this._slideDrawer.dispose();
			this.off();
			this.$el.data('jsView', null);
			this.model.off(null, null, this);
			this.options.deck.off(null, null, this);
			Backbone.View.prototype.remove.apply(this, arguments);

			if (removeModel)
				this.options.deck.removeSlide(this.model);
		},

		_activated: function(model, value) {
			if (value)
				this.$el.addClass('active');
			else
				this.$el.removeClass('active');
		},

		dispose: function() {
			if (!this.disposed) {
				this.disposed = true;
				this.remove();
			}
		},

		_bgChanged: function() {
			var bg = DeckUtils.slideBackground(this.model, this.options.deck);
			this.$el.removeClass();
			var classStr = 'slideSnapshot ' + bg;
			if (this.model.get('active'))
				classStr += ' active';
			this.$el.addClass(classStr);
				// this.$el.css('background-image', bg.styles[0]);
				// this.$el.css('background-image', bg.styles[1]);
		},

		render: function() {
			if (this._slideDrawer)
				this._slideDrawer.dispose();

			this.$el.html(this._template(this.model.attributes));
			var g2d = this.$el.find('canvas')[0].getContext('2d');
			this._slideDrawer = new SlideDrawer(this.model, g2d, this.options.registry);
			var self = this;
			setTimeout(function() {
				self._slideDrawer.repaint();
			});

			if (this.model.get('active'))
				this.$el.addClass('active');

//			this.$el.data('js')

			this._bgChanged();

			return this;
		},

		constructor: function SlideSnapshot() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});