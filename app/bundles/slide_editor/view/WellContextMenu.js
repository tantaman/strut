define(['libs/backbone',
		'../model/WellContextMenuModel',
    'css!styles/slide_editor/wellContextMenu.css'],
function(Backbone, Model) {
	'use strict';

	return Backbone.View.extend({
		className: 'wellContextMenu dispNone absolute',
		initialize: function() {
			this.model = new Model(this._editorModel);
			this._template = JST['bundles/slide_editor/WellContextMenu'];

			//this.model.on('')
			this._currentPos = -1;
			this._hidden = true;
		},

		reposition: function(newPos) {
			if (newPos.y == this._currentPos.y && !this._hidden) return;

			this.$el.css('top', newPos.y);
			this.$el.css('left', newPos.x);

			if (this._hidden) {
				this._hidden = false;
				this.$el.removeClass('dispNone');
			}

			this._currentPos = newPos;
		},

		hide: function() {
			if (this._hidden) return;
			this._hidden = true;
			this.$el.addClass('dispNone');
		},

    slideIndex: function(i) {
      this.model.slideIndex(i);
    },

		render: function() {
			// this.$el.html(this._template(this.model.get('contextButtons')));
			this.$el.html('');
			this.model.get('contextButtons').forEach(function(button) {
				this.$el.append(button.render().$el);
			}, this);
		},

		constructor: function WellContextMenu(editorModel) {
			this._editorModel = editorModel;
			Backbone.View.prototype.constructor.call(this);
		}
	});
});
