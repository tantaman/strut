define(['libs/backbone',
		'../model/WellContextMenuModel',
    'css!styles/slide_editor/wellContextMenu.css'],
function(Backbone, Model) {
	'use strict';

	return Backbone.View.extend({
		className: 'wellContextMenu absolute',

		initialize: function() {
			this.model = new Model(this._editorModel);
			this._template = JST['strut.slide_editor/WellContextMenu'];

			//this.model.on('')
			this._currentPos = -1;
		},

		reposition: function(newPos) {
			if (newPos.y == this._currentPos.y) return;

			this.$el.css('top', newPos.y);
			this.$el.css('left', newPos.x);

			this._currentPos = newPos;
		},

    	slideIndex: function(i) {
      		this.model.slideIndex(i);
    	},

    	dispose: function() {
    		this.model.dispose();
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
