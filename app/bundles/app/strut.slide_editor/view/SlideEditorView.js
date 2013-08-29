define(['libs/backbone',
		'./SlideWell',
		'./OperatingTable'],
function(Backbone, SlideWell, OperatingTable) {
	'use stict';
	return Backbone.View.extend({
		className: 'slideEditor',

		initialize: function() {
			//this._template = JST['strut.slide_editor/SlideEditor'];
			this._well = new SlideWell(this.model._editorModel);
			this._opTable = new OperatingTable(this.model._editorModel);
		},

		remove: function() {
			Backbone.View.prototype.remove.call(this);
			// this.model.dispose();
			this._opTable.dispose();
		},

		render: function() {
			this.$el.html();
			this.$el.append(this._well.render().$el);
			this.$el.append(this._opTable.render().$el);
			return this;
		},

		constructor: function SlideEditorView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});