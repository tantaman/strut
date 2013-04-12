define(['libs/backbone',
		'strut/slide_snapshot/SlideSnapshot',
		'common/Throttler',
		'./WellContextMenu',
		'tantaman/web/widgets/Sortable',
		'css!styles/slide_editor/slideWell.css'],
function(Backbone, SlideSnapshot, Throttler, WellContextMenu, Sortable, empty) {
	'use strict';

	return Backbone.View.extend({
		events: {
			mousemove: '_showContextMenu',
			mouseleave: '_hideContextMenu',
			destroyed: 'dispose'
		},

		className: 'slideWell',

		initialize: function() {
			this._deck.on('slideAdded', this._slideAdded, this);
			this._deck.on('slidesReset', this._slidesReset, this);
			this._doShowContextMenu = this._doShowContextMenu.bind(this);
			this._throttler = new Throttler(100);
			this._contextMenu = new WellContextMenu(this._editorModel);
			this._contextMenu.render();
			this.$slides = $('<div>');
			this._sortable = new Sortable({
				container: this.$slides,
				selector: '> .slideSnapshot'
			});
		},

		_showContextMenu: function(e) {
			//if (e.target != this.$el[0]) return;
			this._throttler.submit(this._doShowContextMenu, {
				rejectionPolicy: 'runLast',
				arguments: [e]
			});
		},

		_hideContextMenu: function(e) {
			if (e.target == this.$el[0]) {
				this._throttler.cancel();
				this._contextMenu.hide();
			}
		},

		_doShowContextMenu: function(e) {
			var offsetY = e.pageY - this.$el.offset().top;
			// if (offsetY == null)
				// offsetY = e.originalEvent.layerY;

			var newPos = (((offsetY+40) / 112) | 0) * 112 - 5;
			this._contextMenu.reposition({x: this.$el.width() / 2 - this._contextMenu.$el.width() / 2, y: newPos});
      		this._contextMenu.slideIndex(Math.ceil(newPos / 112));
		},

		_slidesReset: function(newSlides) {
			var i = 0;
			newSlides.forEach(function(slide) {
				this._slideAdded(slide, i);
				i += 1;
			}, this);
		},

		_slideAdded: function(slide, index) {
			// Append it in the correct position in the well
      		var snapshot = new SlideSnapshot({model: slide, deck: this._deck, registry: this._registry});
      		if (index == 0) {
        		this.$slides.prepend(snapshot.render().$el);
      		} else {
        		var $slides = $('.slideSnapshot');
        		if (index >= $slides.length) {
          			this.$slides.append(snapshot.render().$el);
        		} else {
          			$($slides[index]).before(snapshot.render().$el);
        		}
      		}
		},

		render: function() {
			this.$slides.html('');
			this.$el.html(this.$slides);
			this._deck.get('slides').forEach(function(slide) {
				var snapshot = new SlideSnapshot({model: slide, deck: this._deck, registry: this._registry});
				this.$slides.append(snapshot.render().$el);
			}, this);
			this.$el.append(this._contextMenu.$el);
			return this;
		},

		dispose: function() {
			console.log('DISPOING WELL');
			this._deck.off(null, null, this);
			this._contextMenu.dispose();
			this._sortable.dispose();
		},

		constructor: function SlideWell(editorModel) {
			this._deck = editorModel.deck();
			this._registry = editorModel.registry;
			this._editorModel = editorModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});
