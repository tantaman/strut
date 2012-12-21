define(['libs/backbone',
		'bundles/slide_snapshot/SlideSnapshot',
		'css!styles/slide_editor/slideWell.css'],
function(Backbone, SlideSnapshot, empty) {
	'use strict';
	return Backbone.View.extend({
		className: 'slideWell',

		initialize: function() {
			this._deck.on('slideAdded', this._slideAdded, this);
		},

		_slideAdded: function(slide, index) {
			// Append it in the correct position in the well
		},

		render: function() {
			this._deck.get('slides').forEach(function(slide) {
				var snapshot = new SlideSnapshot({model: slide, deck: this._deck, registry: this._registry});
				this.$el.append(snapshot.render().$el);
			}, this);
			return this;
		},

		constructor: function SlideWell(deck, registry) {
			this._deck = deck;
			this._registry = registry;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});