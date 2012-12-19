define(['libs/backbone',
		'bundles/slide_snapshot/SlideSnapshot',
		'css!styles/slide_well/slideWell.css'],
function(Backbone, SlideSnapshot, empty) {
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
				this.$el.append(new SlideSnapshot({model: slide}));
			}, this);
			return this;
		},

		constructor: function SlideWell(deck) {
			this._deck = deck;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});