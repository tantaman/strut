define(['libs/backbone'], function(Backbone) {
	return Backbone.View.extend({
		events: {
			'click a': '_transitionSelected'
		},

		className: 'cannedTransitionsView',
		initialize: function() {
			this._generators = this.model.registry
				.getBest('strut.presentation_generator.GeneratorCollection');
			
			this._transitions = Array.prototype.concat.apply([],
				this._generators.map(function(generator) {
					return generator.capabilities ? generator.capabilities.transitions : [];
				}));
			
			this.model.deck().on('change:cannedTransition', this._cannedTransitionChanged, this);
		},

		_transitionSelected: function(e) {
			var activated = e.currentTarget.dataset.name;
			this.model.cannedTransition(activated);
		},
		
		_cannedTransitionChanged: function() {
			var activated = this.model.cannedTransition() || this._transitions[0];
			this.$el.find('.active').removeClass('active');
			this.$el.find('[data-name="' + activated + '"]').addClass('active');
			
			this._generators.some(function(generator) {
				if(generator.capabilities && generator.capabilities.transitions.includes(activated)) {
					this.model.set('generator', generator);
					return true;
				}
			}, this);
		},

		render: function() {
			this.$el.html(
				JST['strut.transition_editor/CannedTransitions'](this._transitions));
			this.$el.find('[data-name="' + (this.model.cannedTransition() || this._transitions[0]) + '"]').addClass('active');
			return this;
		},

		dispose: function() {

		},

		constructor: function CannedTransitionsView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});