define(['libs/backbone',
		'strut/header/view/HeaderView',
		'./CustomBgStylesheet'],
function(Backbone, Header, CustomBgStylesheet) {
	return Backbone.View.extend({
		className: 'container-fluid',
		initialize: function() {
			this._header = new Header({model: this.model.get('header')});

			this.model.on('change:activeMode', this._modeChanged, this);

			this._customBgSheet = new CustomBgStylesheet(this.model);
		},

		render: function() {
			this.$el.empty();
			this.$el.append(this._header.render().$el);
			var activeMode = this.model.get('activeMode');
			if (activeMode)
				this.$el.append(activeMode.view.render().$el);
			else
				this._renderNoMode();

			return this;
		},

		_modeChanged: function(undefined, mode) {
			this.$el.append(mode.view.render().$el);
		},

		_renderNoMode: function() {
			this.$el.append('<div class="alert alert-error">No modes available.  Did some plugins fail to load?</div>');
		}
	});
});