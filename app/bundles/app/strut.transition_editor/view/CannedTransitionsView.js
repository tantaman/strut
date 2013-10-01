define(['libs/backbone'], function(Backbone) {
	function img() {
		return 'styles/img/' + this.name + '.png';
	};

	var canned = [
		{
			name: 'carousel',
			img: img,
			style: 'height: 126px;'
		},
		{
			name: 'classic',
			img: img
		},
		{
			name: 'concave',
			img: img,
			style: 'height: 126px;'
		},
		{
			name: 'coverflow',
			img: img
		},
		{
			name: 'cube',
			img: img
		},
		{
			name: 'cubeb',
			img: img
		},
		{
			name: 'cards',
			img: img
		},
		{
			name: 'none',
			img: 'styles/strut.themes/img/nobg.png'
		}
	];

	return Backbone.View.extend({
		events: {
			'click .thumbnail': '_transitionSelected'
		},

		className: 'cannedTransitionsView',
		initialize: function() {
			// TODO: get the available "canned" transitions
			// from the generator's metadata?
			// Or just drop Revea.js support and only focus
			// on bespoke?

			// Do a survey of the number of presentations
			// that actually use the "basement" feature...
			var transition = this.model.cannedTransition() || 'none';

			canned.some(function(c) {
				if (c.name == transition) {
					c.active = true;
				} else {
					c.active = false;
				}
			});
		},

		_transitionSelected: function(e) {
			this.$el.find('.active').removeClass('active');
			var activated = e.currentTarget.dataset.name;
			this.model.cannedTransition(activated);

			$(e.currentTarget).addClass('active');
		},

		render: function() {
			this.$el.html(
				JST['strut.transition_editor/CannedTransitions'](canned));
			return this;
		},

		dispose: function() {

		},

		constructor: function CannedTransitionsView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});