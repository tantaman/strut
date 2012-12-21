define(['libs/backbone',
		'bundles/slide_drawer/SlideDrawer',
		'css!styles/slide_snapshot/slideSnapshot.css'],
function(Backbone, SlideDrawer, css) {
	'use strict';

	return Backbone.View.extend({
		className: 'slideSnapshot',
		events: {
			'click': '_selected',
			'click .removeBtn': '_removeClicked'
		},

		initialize: function() {
			this.model.on('change:active', this._activated, this);
			this.model.on('dispose', this.dispose, this);
			this.options.deck.on('change:background', this._bgChanged, this);

			this._template = JST['bundles/slide_snapshot/templates/SlideSnapshot'];
		},

		_selected: function() {
			this.model.set('selected', true);
			this.model.set('active', true);
		},

		_removeClicked: function(e) {
			this.remove();
			this.stopPropagation();
		},

		remove: function() {
			this._slideDrawer.dispose();
			this.off();
			this.$el.data('jsView', null);
			this.model.off(null, null, this);
			this.options.deck.off(null, null, this);
			Backbone.View.prototype.remove.apply(this, arguments);
		},

		_activated: function(model, value) {
			if (value)
				this.$el.addClass('active');
			else
				this.$el.removeClass('active');
		},

		dispose: function() {
			this.remove();
		},

		_bgChanged: function() {
			var bg = this.options.deck.get('background');
			if (bg) {
				this.$el.css('background-image', bg.styles[0]);
				this.$el.css('background-image', bg.styles[1]);
			}
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