define(['libs/backbone'], function(Backbone) {
	return Backbone.View.extend({
		initialize: function() {
			// TODO: get the available "canned" transitions
			// from the generator's metadata?
			// Or just drop Revea.js support and only focus
			// on bespoke?

			// Do a survey of the number of presentations
			// that actually use the "basement" feature...
		},

		render: function() {
			this.$el.html(
				JST['strut.transition_editor/CannedTransitions']());
			return this;
		},

		dispose: function() {

		},

		constructor: function CannedTransitionsView() {
			Backbone.View.prototype.constructor.call(this);
		}
	});
});