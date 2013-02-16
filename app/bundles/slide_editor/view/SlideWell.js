define(['libs/backbone',
		'bundles/slide_snapshot/SlideSnapshot',
		'common/Throttler',
		'css!styles/slide_editor/slideWell.css'],
function(Backbone, SlideSnapshot, Throttler, empty) {
	'use strict';

	var throtOpts = {
		rejectionPolicy: 'runLast'
	};

	return Backbone.View.extend({
		events: {
			mousemove: '_showContextMenu'
		},

		className: 'slideWell',

		initialize: function() {
			this._deck.on('slideAdded', this._slideAdded, this);
			this._doShowContextMenu = this._doShowContextMenu.bind(this);
			this._throttler = new Throttler(250);
		},

		_showContextMenu: function() {
			this._throttler.submit(this._doShowContextMenu, throtOpts);
		},

		_doShowContextMenu: function() {
			console.log('Showing context menu');
		},

		_slideAdded: function(slide, index) {
			// Append it in the correct position in the well
		},

		render: function() {
			this._deck.get('slides').forEach(function(slide) {
				var snapshot = new SlideSnapshot({model: slide, deck: this._deck, registry: this._registry});
				this.$el.append(snapshot.render().$el);
			}, this);
			return this;
		},

		constructor: function SlideWell(editorModel) {
			this._deck = editorModel.deck();
			this._registry = editorModel.registry;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});