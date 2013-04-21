define(['libs/backbone'],
function(Backbone) {
	return Backbone.View.extend({
		name: "Zip",
		initialize: function() {
			this.render();
		},

		show: function($container) {
			$container.append(this.$el);
		},

		hide: function() {
			this.$el.detach();
		},

		hidden: function() {},

		render: function() {
			this.$el.html('Still in progress.  The best way to do this at the moment is to:<br/>'
				+ '<ol><li>Click Preview, then</li><li>Use your browser\'s <code>Save Page As</code> functionality<br/>to save the entire presentation to disk.</li></ol>');
			return this;
		}
	});
});