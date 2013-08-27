define(['libs/backbone',
		'strut/slide_snapshot/TransitionSlideSnapshot',
		'css!styles/transition_editor/slideTable.css'],
function(Backbone, TransitionSlideSnapshot, empty) {
	'use strict';

	return Backbone.View.extend({
		className: 'slideTable slideEditArea',

		/*
		TODO: render the slides...
		The button bar will need to be taken care of
		through something else...
		Register button bars with a given mode?

		strut.TransitionButtonProviders??

		My model is a TransitionEditorModel
		which contains a reference to the editorModel
		and registry.
		*/

		initialize: function() {
			this._snapshots = [];

			this.model.deck().on('change:surface', this._surfaceChanged, this);
		},

		_surfaceChanged: function(model, surf) {
			this.$el.removeClass();
			this.$el.addClass('slideTable ' + surf);
		},

		render: function() {
			this.$el.html('');
			var deck = this.model.deck();
			this.$el.addClass(deck.get('surface') || 'defaultbg');

			var colCnt = 6;
			var cnt = 0;
			deck.get('slides').forEach(function(slide) {
				var x = slide.get('x');

				if (x == null) {
					slide.set('x', cnt * 280 + 30);
					slide.set('y', ((cnt / colCnt) | 0) * 280 + 80);
				}
				++cnt;

				var snapshot = new TransitionSlideSnapshot({model: slide,
					registry: this.model.registry, deck: deck});
				this._snapshots.push(snapshot);
				this.$el.append(snapshot.render().$el);
			}, this);

			return this;
		},

		remove: function() {
			Backbone.View.prototype.remove.call(this);
			this.dispose();
		},

		dispose: function() {
			this.model.deck().off(null, null, this);
		},

		constructor: function TransitionEditorView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});