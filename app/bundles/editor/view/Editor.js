define(['libs/backbone',
		'bundles/header/view/Header'],
function(Backbone, Header) {
	return Backbone.View.extend({
		initialize: function() {
			this._header = new Header({model: this.model.get('header')});
			this._createMode();
		},

		_createMode: function() {
			var modeId = this.model.get('activeMode');
			var modeService = this.options.registry.getBest({
				interfaces: 'strut.EditMode',
				meta: { id: modeId }
			});

			if (modeService)
				this.activeMode = modeService.createMode(this.model);
		},

		render: function() {
			this.$el.html('');

			this.$el.append(this._header.render().$el);
			if (this.activeMode)
				this.$el.append(this.activeMode.render().$el);
			else
				this._renderNoMode();

			return this;
		},

		_renderNoMode: function() {
			this.$el.append('<div class="alert alert-error">No modes available.  Did some plugins fail to load?</div>');
		}
	});
});