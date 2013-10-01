/*
Subscribes for updates to the set of transition editors that should be
made available.

Renders and activates that set whenever it changes.
*/
define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		initialize: function() {
		},

		remove: function() {
			this.dispose();
		},

		dispose: function() {
			Backbone.View.prototype.remove.call(this);
			this.model.dispose();
		},

		render: function() {
			// the css should be applied to position
			// them correctly regardless of their order in the doc?

			this.model.transitionEditors.forEach(function(editor) {
				editor.render();
				this.$el.append(editor.$el);
			}, this);

			return this;
		},

		constructor: function Overview() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});