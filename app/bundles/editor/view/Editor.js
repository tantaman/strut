define(['libs/backbone',
		'bundles/header/view/Header'],
function(Backbone, Header) {
	return Backbone.View.extend({
		initialize: function() {
			this._modes = this.options.registry
				.getInvoke('strut.ModeContributor', 'createView', this.model);

			this._header = new Header(this.model.get('header'));
			this._template = JST['bundles/editor/templates/Editor'];
		},

		render: function() {
			var activeModeId = this.model.activeMode();
			this.$el.html('');

			this.$el.append(this._header.render().$el);
			var currentMode = this._modes[activeModeId];
			this.$el.append(currentMode.render().$el);

			// Now render the header an put it in the correct location...
			// And then da mode

			return this;
		}
	});
});