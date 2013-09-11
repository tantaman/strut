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
			this._opTable = new OperatingTable(this.model._editorModel, this.model);
			this._markdownEditor = new MarkdownEditor();

			this.model.on('change:mode', this._modeChanged, this);
		},

		remove: function() {
			Backbone.View.prototype.remove.call(this);
			this.model.dispose();
			this._opTable.dispose();
		},

		render: function() {
			this.$el.html();
			this.$el.append(this._well.render().$el);
			this.$el.append(this._opTable.render().$el);
			return this;
		},

		_modeChanged: function(mode) {
			if (mode == 'markdown') {

			} else if (mode == 'preview') {

			} else {
				throw "Illegal mode";
			}
		},

		constructor: function SlideEditorView() {
			Backbone.View.prototype.constructor.apply(this, arguments);
		}
	});
});